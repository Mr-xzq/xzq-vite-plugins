import fg from 'fast-glob';
import fs from 'fs-extra';
import { resolve } from 'node:path';
import { normalizePath } from 'vite';
import { getCacheDirName, getCacheFileFullPath, readCacheFileAsObj, resetByCacheCodeMap, writeCacheFileToJson } from './cache.js';
import { getVueVersion, log } from './utils.js';

let VUE_VERSION;
let isVue2;
let isVue2Dot7;
let isVue3;

// vue: ^2.0.0 且 < 2.7.0 --> vue-template-compiler
// vue: ^2.7.0 或 ^3.0.0 --> vue/compiler-sfc
let parseComponent;
const getParseComponent = async () => {
  let vueCompilerSFC, vueTemplateCompiler, resParseComponent;

  if (isVue3) {
    vueCompilerSFC = await import('vue/compiler-sfc');
    resParseComponent = vueCompilerSFC.parse;
  } else if (isVue2Dot7) {
    vueCompilerSFC = await import('vue/compiler-sfc');
    resParseComponent = vueCompilerSFC.parse;
  } else if (isVue2) {
    vueTemplateCompiler = await import('vue-template-compiler');
    resParseComponent = vueTemplateCompiler.parseComponent;
  }

  return resParseComponent;
};

let script;
let scriptContent;
const getScriptAndContent = (originCode = '', parseComponentFunc = () => ({})) => {
  /*
    <script>
      ...content
    </script>
  */
  let parseRes;
  if (isVue3) {
    parseRes = parseComponentFunc(originCode);
    script = parseRes?.descriptor?.script ?? {};
  } else if (isVue2Dot7) {
    parseRes = parseComponentFunc({
      source: originCode,
    });
    script = parseRes?.script ?? {};
  } else if (isVue2) {
    parseRes = parseComponentFunc(originCode);
    script = parseRes?.script ?? {};
  }

  return [script, script?.content ?? ''];
};

const canTransformCode = (script = {}, scriptContent = '') => {
  // content 中是否包含 jsx 代码
  let containJsx = codeContainJsxReg.test(scriptContent);

  // 是否已经标注了 lang --> <script lang="jsx/tsx">
  let scriptTagContainJsxLang = ['jsx', 'tsx'].includes(script?.lang);

  log({
    containJsx,
    scriptTagContainJsxLang,
  });

  return containJsx && !scriptTagContainJsxLang;
};

// 代码是否包含 jsx
// 正则表达式如果用 /g 的话, 那么要注意每一次 test 或者其他操作都有可能导致匹配的 reg.lastIndex 往后挪, 导致后面匹配不到
export const codeContainJsxReg = /(return|=>)[\n\s]*?[({]?[\n\s]*?(?=(<(\w+)[^>]*>(.*?<\/\3>)?))/;
// script 标签的 lang 是否已经是 jsx / tsx
// const scriptTagContainJsxLangReg = /<script[^<]*?lang\s*?=\s*?"\s*?[jt]sx\s*?"[^<]*?>/g

let cacheFileFullPath, cacheDirName, cacheCodeMap;

const defaultOptions = {
  // 动态在运行时添加 lang="jsx", 要谨慎点, 这样会降低 serve 时的性能
  runTime: false,
  // 是否打印日志
  logEnabled: false,
};

const autoScriptJsxPlugin = ({ runTime = false, logEnabled = true } = defaultOptions) => {
  process.env.__logEnabled = logEnabled;

  const pluginObj = {
    name: 'vite:vue-auto-script-jsx',
    // 最好添加 pre, 在 vite 核心插件编译之前调用 防止后续插件解析时出异常
    enforce: 'pre',
    config() {
      if (!runTime) return;

      // 在 serve 阶段关闭依赖预购键(对开发服务性能会有较大的影响)
      return {
        optimizeDeps: {
          disabled: true,
        },
      };
    },
    // 当 vite.config.js 解析完之后触发
    // 种类： async, parallel
    async configResolved(resolvedConfig) {
      VUE_VERSION = await getVueVersion();
      // '2.6.14' --> [2, 6, 14]
      const versionArr = VUE_VERSION.split('.').map((verStr) => Number(verStr));
      // >=2.0.0 <2.7.0
      // 这里不能这样写: 2 <= versionArr[0] < 3
      isVue2 = versionArr[0] >= 2 && versionArr[0] < 3 && versionArr[1] < 7;
      // ^2.7.0
      isVue2Dot7 = versionArr[0] === 2 && versionArr[1] === 7;
      // ^3.0.0
      isVue3 = versionArr[0] >= 3;

      log({ VUE_VERSION, isVue2, isVue2Dot7, isVue3 });

      parseComponent = await getParseComponent();
      log('parseSFC-Func: ', parseComponent);

      if (!runTime) {
        // 项目根目录
        let projectRootDir = resolvedConfig?.root ?? process.cwd;

        // 获取缓存
        cacheDirName = getCacheDirName(projectRootDir);
        cacheFileFullPath = getCacheFileFullPath(cacheDirName);
        cacheCodeMap = readCacheFileAsObj(cacheFileFullPath);

        // 相对于项目根目录, 可以精确具体要扫描的目录, 减少扫描时间
        let targetDirArr = ['src'];
        const scanPathArr = targetDirArr.map((targetDir) =>
          // 只扫描 .vue 文件
          normalizePath(resolve(projectRootDir, targetDir, '**/*.vue'))
        );

        // log('scanPathArr: ', scanPathArr);

        const scanResFilePathArr = fg.sync(scanPathArr, {
          absolute: true,
        });

        // log('scanResFilePathArr: ', scanResFilePathArr);

        scanResFilePathArr.forEach((scanResFilePath) => {
          let code = fs.readFileSync(scanResFilePath, { encoding: 'utf-8' });

          // 解析出 script 标签的代码, 包含 script 标签本身
          [script, scriptContent] = getScriptAndContent(code, parseComponent);
          // log("scriptContent: ", scriptContent);

          // 1. scriptContent 中是否包含 jsx 代码
          // 2. script 是否已经标注了 lang --> <script lang="jsx/tsx">
          const canTransform = canTransformCode(script, scriptContent);

          if (canTransform) {
            log('target: ', scanResFilePath);

            // codeRecordsArr[0] --> originCode
            let codeRecordsArr = cacheCodeMap[scanResFilePath];

            if (!Array.isArray(codeRecordsArr)) {
              cacheCodeMap[scanResFilePath] = [code];
              codeRecordsArr = cacheCodeMap[scanResFilePath];
            }

            code = code.replace('<script>', '<script lang="jsx">');

            // 只要涉及到修改原始文件的代码, 都需要记录操作
            fs.writeFileSync(scanResFilePath, code, { encoding: 'utf-8' });
            codeRecordsArr.push(code);
          }
        });

        // 将修改文件的记录缓存到本地
        writeCacheFileToJson(cacheFileFullPath, cacheCodeMap);
      }
    },
    // 种类： async, sequential, 它针对多个文件执行多次
    transform(code, id) {
      // 这里需要关闭依赖预构建, 不然在依赖预购键的扫描依赖的过程中就会因为 loader 配置错误而报错
      // 根本就走不到插件调用这里来
      if (!runTime) return;

      if (id.endsWith('.vue')) {
        // log("id: ", id);

        // 解析出 script 标签的代码, 包含 script 标签本身
        [script, scriptContent] = getScriptAndContent(code, parseComponent);
        // log("scriptContent: ", scriptContent);

        // 1. scriptContent 中是否包含 jsx 代码
        // 2. script 是否已经标注了 lang --> <script lang="jsx/tsx">
        const canTransform = canTransformCode(script, scriptContent);

        if (canTransform) {
          log('target: ', id);
          code = code.replace('<script>', '<script lang="jsx">');
        }
      }

      return {
        code,
        map: null,
      };
    },
  };

  if (process.env.VITEST) {
    process.env.__logEnabled = true;
    // buildEnd 只会在你调用 devServer.close 等方法正常关闭时才会触发, 当我们在终端通过 ctrl + c 等方式强制关闭时, 是不会触发这个钩子的
    pluginObj.buildEnd = () => {
      resetByCacheCodeMap(cacheFileFullPath, cacheCodeMap);
    };
  }

  return pluginObj;
};

export default autoScriptJsxPlugin;
