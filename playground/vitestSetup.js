/*
  不要和 test-utils 交叉引用, 这样会出现引用失效的问题
*/

import { dirname, resolve } from 'node:path';
import fs from 'fs-extra';
import { createServer, loadConfigFromFile, mergeConfig, normalizePath } from 'vite';
import { chromium } from 'playwright-chromium';

export const workspaceRoot = resolve(__dirname, '../');
export const isBuild = !!process.env.VITE_TEST_BUILD;
export const isServe = !isBuild;

// 可能是自定义的服务进程, 可能是 viteServer
export let server;
/**
 * Vite Server when testing server
 */
export let viteServer;
/**
 * Path to the current test file
 */
export let testFilePath;
/**
 * Path to the test folder
 */
export let testFileDir;

// vite.config.js 所在的目录
export let testRootDir;
/**
 * Test folder name
 */
export let testFileDirName;

/**
 * current test using vite inline config
 * when using server.js is not possible to get the config
 */
export let viteConfig;

export const serverLogMap = new Map();
export let serverUrlLogs = [];
export const browserLogs = [];
export const browserErrors = [];

export let resolvedConfig;

export let page;
export let browser;
export let viteServerUrl;

const logPrefix = '[vite-test]';

beforeAll(async (s) => {
  const suite = s;
  // skip browser setup for non-playground tests
  if (!suite.filepath.includes('playground')) {
    return;
  }

  // 无头模式, 表示只在内存中打开浏览器, 而不是实际在窗口上弹出来
  browser = await chromium.launch({ headless: true });
  page = await browser.newPage();

  try {
    page.on('console', (msg) => {
      browserLogs.push(msg.text());
    });
    page.on('pageerror', (error) => {
      browserErrors.push(error);
    });

    testFilePath = suite.filepath;
    testFileDirName = normalizePath(testFilePath).match(/playground\/([\w-]+)\//)?.[1];
    testFileDir = dirname(testFilePath);

    await startDefaultViteServer();
  } catch (e) {
    console.log(`${logPrefix} dev server start error: ${e}`);
    await reset();
  }
});

afterAll(async () => {
  await reset();
});

const reset = async () => {
  serverLogMap?.clear();
  await page?.close();
  await server?.close();
  console.log(`${logPrefix} dev server stop success`);
  await browser?.close();
};

export async function startDefaultViteServer() {
  testRootDir = resolve(dirname(testFilePath), '..');

  const testCustomConfig = resolve(testRootDir, 'vite.config.js');

  let config;

  // playground/pkg/vite.config.js
  if (fs.existsSync(testCustomConfig)) {
    // test has custom server configuration.
    // const exportConfig = await import(testCustomConfig).then((r) => r.default);
    // config = typeof exportConfig === 'function' ? exportConfig({ command: 'serve', mode: 'development' }) : config;
    const loadRes = await loadConfigFromFile({ command: 'serve', mode: 'development' }, testCustomConfig);
    config = loadRes.config;
  }

  const defaultOptions = {
    // 重点就是 configFile 需要设置为 false
    // 指明要使用的配置文件。如果没有设置，Vite 将尝试从项目根目录自动解析。设置为 false 可以禁用自动解析功能。
    // 如果不禁用自动解析会导致有些插件或者有些配置会触发两次
    configFile: false,
    logLevel: 'slient',
    server: {
      watch: {
        // During tests we edit the files too fast and sometimes chokidar
        // misses change events, so enforce polling for consistency
        usePolling: true,
        interval: 100,
      },
      host: true,
    },
    build: {
      // test faster
      minify: false,
      // esbuild do not minify ES lib output since that would remove pure annotations and break tree-shaking
      // skip transpilation during tests to make it faster
      target: 'esnext',
      // tests are flaky when `emptyOutDir` is `true`
      emptyOutDir: false,
    },
    customLogger: createInMemoryLogger(serverLogMap),
  };

  // 获取 resolvedConfig
  const resolvedPlugin = () => ({
    name: 'vite-plugin-get-resolved-config',
    configResolved(config) {
      resolvedConfig = config;
    },
  });

  defaultOptions.plugins = [resolvedPlugin()];

  viteConfig = mergeConfig(defaultOptions, config || {});

  server = viteServer = await (await createServer(viteConfig)).listen();

  // 将 url 打印到 server log 中
  viteServer.printUrls();
  // 从 server log 中抽取出 server url
  extractViteTestUrlFromServerLogInfo(serverLogMap);

  viteServerUrl = serverUrlLogs[0];

  // 由于 vite 默认就是按需加载模式, 因此只有访问页面时才会加载和转换一些资源, 然后一些错误进入 server log
  const response = await page?.goto(viteServerUrl);
  const responseStatusIsOk = response.ok();
  if (responseStatusIsOk) {
    console.log(`${logPrefix} server start success`);
  }

  const errorLogs = getErrorLogs();
  if (errorLogs?.toString().includes('Internal server error')) {
    console.error('errorLogs: ', errorLogs);
    throw `${logPrefix} Internal server error`;
  }
  // console.log('serverUrlLogs: ', serverUrlLogs)
}

// 自定义 vite logger, 原来的 logLevel 这里就需要自己实现了
function createInMemoryLogger(logsMap = new Map()) {
  const loggedErrors = new WeakSet();
  const warnedMessages = new Set();

  const addLogByLevel = (level = 'info', msg) => {
    if (!logsMap.has(level)) {
      logsMap.set(level, []);
    }
    logsMap.get(level).push(msg);
  };

  const logger = {
    hasWarned: false,
    hasErrorLogged: (err) => loggedErrors.has(err),
    clearScreen: () => {},
    info(msg) {
      addLogByLevel('info', msg);
    },
    warn(msg) {
      addLogByLevel('warn', msg);
      logger.hasWarned = true;
    },
    warnOnce(msg) {
      if (warnedMessages.has(msg)) return;
      addLogByLevel('warnOnce', msg);
      logger.hasWarned = true;
      warnedMessages.add(msg);
    },
    error(msg, opts) {
      addLogByLevel('error', msg);
      if (opts?.error) {
        loggedErrors.add(opts.error);
      }
    },
  };
  return logger;
}

// 抽取出 vite server url
function extractViteTestUrlFromServerLogInfo(logsMap = new Map()) {
  // server log 打印出来的值包含颜色
  // origin: "  \u001b[32m➜\u001b[39m  \u001b[1mLocal\u001b[22m:   \u001b[36mhttp://localhost:\u001b[1m5173\u001b[22m/\u001b[39m"
  // res: http://localhost

  const extractUrlInLogReg = /https?:\/\/((localhost)|(\d{1,3}\.){3}\d{1,3})/i;
  const devBase = viteServer.config.base;

  const serverLogsInfoArr = logsMap.get('info') ?? [];
  serverUrlLogs = serverLogsInfoArr.map((log) => {
    if (extractUrlInLogReg.test(log)) {
      log = `${log.match(extractUrlInLogReg)[0]}:${viteServer.config.server.port}${devBase === '/' ? '' : devBase}`;
      return log;
    }
  });
}

export function getErrorLogs() {
  return serverLogMap.get('error');
}
