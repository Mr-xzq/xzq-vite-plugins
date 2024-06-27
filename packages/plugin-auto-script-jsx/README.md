# plugin-auto-script-jsx

<p align="center">
  <a href="https://npmjs.com/package/plugin-auto-script-jsx"><img src="https://img.shields.io/npm/v/plugin-auto-script-jsx.svg" alt="npm package"></a>
  <a href="https://nodejs.org/en/about/releases/"><img src="https://img.shields.io/node/v/plugin-auto-script-jsx.svg" alt="node compatibility"></a>
  <a href="https://github.com/Mr-xzq/xzq-vite-plugins/actions/workflows/npm-publish.yml"><img src="https://github.com/Mr-xzq/xzq-vite-plugins/actions/workflows/npm-publish.yml/badge.svg" alt="publish node package"></a>
</p>

## 概述

当你从别的构建工具 `(vue-cli, webpack...)` 等切换到 `vite`，并且你的项目中有使用到 `jsx` 时，你会发现这样的错误日志：

```shell
X [ERROR] The JSX syntax extension is not currently enabled

    script:E:/Desktop/todo/个人项目/xzq-vite-plugins/playground/auto-script-jsx/vue2/src/containJsxVue/test2.vue?id=0:5:6:
      5 │       <div>
        ╵       ^

  The esbuild loader for this file is currently set to "js" but it must be set to "jsx" to be able
  to parse JSX syntax. You can use "loader: { '.js': 'jsx' }" to do that.
```

这是因为：

`Vite` 出于编译性能考虑，不会和其他的构建工具一样，对每个处理的 `.js` 等文件进行完整的 `AST` 处理，以防万一它包含 `JSX`。

它只会针对有对应的 `.jsx` 扩展名(如果是 `.vue` 文件, 只需要 `<script lang="jsx"></script>`)的文件进行完整的 `AST` 转换。

这样 `Vite` 就能避免无谓的编译期间的开销。

因为在大多数情况下，普通的 `.js` 文件不需要完整的 `AST` 转换才能在浏览器中工作。

具体原因可以参考：[Cannot use jsx syntax in js file.](https://github.com/vitejs/vite/issues/2727)

这时你就需要手动针对每个包含 `jsx` 的文件手动更改文件后缀名或者添加`lang="jsx"`，当你的文件数量太多时，那可太麻烦了。

此时你可以尝试此插件。

## 优缺点

### 优点

- 自动给包含 `jsx`代码的 `.vue` 文件添加 `lang="jsx"`
- 兼容 `Vue2` 和 `Vue3`；

### 缺点

- 只支持 `Vite`；
- 只能给 `.vue` 文件添加 `lang="jsx"`

## 安装

### Vite

```shell
npm i plugin-auto-script-jsx -D

pnpm add plugin-auto-script-jsx -D

yarn add plugin-auto-script-jsx -D
```

`vite.config.js`：

```js
import { defineConfig } from 'vite';
import autoScriptJsxPlugin from 'plugin-auto-script-jsx';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [autoScriptJsxPlugin()],
});
```

## 使用案例

> 以下测试包含了 `options api` 和 `composition api` 两种风格

### 相同的 .vue 模板文件

`composition api`：

```jsx
<script>
export default {
  setup() {
    const dom = <h2 id="contain-jsx-test1">contain-jsx-test1</h2>;
    return () => {
      return <div>{dom}</div>;
    };
  },
};
</script>
```

`options api`：

```jsx
<script>
export default {
  render() {
    return (
      <div>
        <h2 id="contain-jsx-test2">contain-jsx-test2</h2>
      </div>
    );
  },
};
</script>
```

### Vue 2(非 2.7)

```js
import { defineConfig } from 'vite';
import { createVuePlugin as vue2 } from 'vite-plugin-vue2';
import autoScriptJsxPlugin from 'plugin-auto-script-jsx';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  return {
    plugins: [
      vue2({
        jsx: true,
        jsxOptions: {
          // https://github.com/vuejs/jsx-vue2/tree/dev/packages/babel-preset-jsx#vuebabel-preset-jsx
          // Cannot read properties of undefined (reading '$createElement')
          compositionAPI: true,
        },
      }),
      autoScriptJsxPlugin({
        runTime: false,
      }),
      inspect(),
    ],
    resolve: {
      // 默认不支持 .vue 扩展名
      // 并非 bug, 而是 vite 设计就是如此: https://github.com/vitejs/vite/issues/178#issuecomment-630138450
      // 配置参考: https://vitejs.bootcss.com/config/#resolve-extensions
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    },
  };
});
```

在 `runTime: false` 的情况下，会在编译时自动给包含 `jsx`代码的 `.vue`文件中的 `<script>` 标签添加 `lang = 'jsx'`。

### Vue 2.7

```js
import { defineConfig } from 'vite';
import vue2Dot7 from '@vitejs/plugin-vue2';
import vue2Dot7Jsx from '@vitejs/plugin-vue2-jsx';
import autoScriptJsxPlugin from 'plugin-auto-script-jsx';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  return {
    plugins: [
      vue2Dot7(),
      vue2Dot7Jsx(),
      autoScriptJsxPlugin({
        runTime: true,
      }),
    ],
    resolve: {
      // 默认不支持 .vue 扩展名
      // 并非 bug, 而是 vite 设计就是如此: https://github.com/vitejs/vite/issues/178#issuecomment-630138450
      // 配置参考: https://vitejs.bootcss.com/config/#resolve-extensions
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    },
  };
});
```

在 `runTime: true` 的情况下，会在运行时自动给内存中的包含 `jsx`代码的 `.vue`文件中的 `<script>` 标签添加 `lang = 'jsx'`，注意，此时并不会修改真实的存储在硬盘上的文件。

### Vue3

```js
import { defineConfig } from 'vite';
import vue3 from '@vitejs/plugin-vue';
import vue3Jsx from '@vitejs/plugin-vue-jsx';
import autoScriptJsxPlugin from 'plugin-auto-script-jsx';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  return {
    plugins: [
      vue3(),
      vue3Jsx(),
      autoScriptJsxPlugin({
        // 不打印日志
        logEnabled: false,
      }),
    ],
    resolve: {
      // 默认不支持 .vue 扩展名
      // 并非 bug, 而是 vite 设计就是如此: https://github.com/vitejs/vite/issues/178#issuecomment-630138450
      // 配置参考: https://vitejs.bootcss.com/config/#resolve-extensions
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    },
  };
});
```

## 配置项

以下显示配置的默认值：

```js
autoScriptJsxPlugin({
  // 会打印出当前环境的 Vue 版本, 和对应的文件是否
  // containJsx: 该文件是否包含 jsx; scriptTagContainJsxLang: 该 .vue 文件是否在 script 标签上有 lang = 'jsx'
  logEnabled: true,
  // 默认采用的是在编译时修改文件的策略
  // 如果为 true, 那么就是在运行时对内存中的文件进行修改, 相比于编译时修改, runTime: true, 对用户的真实存储在硬盘中的文件不会有修改
  // 但是它的缺点是: 它需要先关闭依赖预构建, 不然在依赖预构建的扫描依赖的过程中 esbuild 就会因为 loader 配置错误而报错, 根本就走不到插件调用这里来
  runTime: false,
});
```

`log info`

```shell
> vite

[vite:vue-auto-script-jsx]   {
  VUE_VERSION: '2.7.8',
  isVue2: false,
  isVue2Dot7: true,
  isVue3: false
}
[vite:vue-auto-script-jsx]   parseSFC-Func:  [Function: parse]
[vite:vue-auto-script-jsx]   { containJsx: false, scriptTagContainJsxLang: false }
[vite:vue-auto-script-jsx]   { containJsx: true, scriptTagContainJsxLang: false }
[vite:vue-auto-script-jsx]   target:  E:/Desktop/todo/个人项目/xzq-vite-plugins/playground/auto-script-jsx/vue2.7/src/containJsxVue/test1.vue
[vite:vue-auto-script-jsx]   { containJsx: true, scriptTagContainJsxLang: false }
[vite:vue-auto-script-jsx]   target:  E:/Desktop/todo/个人项目/xzq-vite-plugins/playground/auto-script-jsx/vue2.7/src/containJsxVue/test2.vue
[vite:vue-auto-script-jsx]   { containJsx: false, scriptTagContainJsxLang: false }
```

## 警告

当 `runTime: false` 时，该插件会对硬盘上存储的真实文件进行修改，因此建议先通过 `git` 提交一下，保持工作区和暂存区的纯净，然后再运行此插件。

这样方便追踪此插件修改的文件。

当 `runTime: true` 时，它需要先关闭依赖预构建, 不然在依赖预构建的扫描依赖的过程中 esbuild 就会因为 loader 配置错误而报错, 根本就走不到插件调用这里来。

关闭依赖预构建带来的影响就是开发时速度变慢，而且还有可能出现不同的模块风格带来的兼容性问题。

参考：[ vite 依赖与构建。](https://cn.vitejs.dev/guide/dep-pre-bundling.html#dependency-pre-bundling)

## bin

> 不建议使用，有风险，这是兜底方案，最好还是通过 `git` 查看记录进行还原。

当你选择 `runTime: false` 时， 会对硬盘上的实际文件进行修改，其实这个操作是有些危险的，这里我们提供的一个还原命令：

```shell
npx vue-auto-script-jsx --reset
```

原理是我们会将对文件进行修改的操作记录缓存起来，然后当你输入这个命令时，它会该插件将修改过的文件进行还原。

## 缓存文件

缓存文件的路径为：`${projectRoot}/node_modules/.vue-auto-script-jsx/cache.json`

存储的内容：

`{ 文件路径: 文件修改的历史记录 }`

这里可以发现，文件修改历史记录是一个数组，那么第一个就是原始文件内容。

```json
{
  "xxx/test1.vue": [
    "<script>\nexport default {\n  setup() {\n    const dom = <h2 id=\"contain-jsx-test1\">contain-jsx-test1</h2>;\n    return () => {\n      return <div>{dom}</div>;\n    };\n  },\n};\n</script>\n",
    "<script lang=\"jsx\">\nexport default {\n  setup() {\n    const dom = <h2 id=\"contain-jsx-test1\">contain-jsx-test1</h2>;\n    return () => {\n      return <div>{dom}</div>;\n    };\n  },\n};\n</script>\n",
    "<script>\nexport default {\n  setup() {\n    const dom = <h2 id=\"contain-jsx-test1\">contain-jsx-test1</h2>;\n    return () => {\n      return <div>{dom}</div>;\n    };\n  },\n};\n</script>\n"
  ],
  "xxx/test2.vue": [
    "<script>\nexport default {\n  render() {\n    return (\n      <div>\n        <h2 id=\"contain-jsx-test2\">contain-jsx-test2</h2>\n      </div>\n    );\n  },\n};\n</script>\n",
    "<script lang=\"jsx\">\nexport default {\n  render() {\n    return (\n      <div>\n        <h2 id=\"contain-jsx-test2\">contain-jsx-test2</h2>\n      </div>\n    );\n  },\n};\n</script>\n",
    "<script>\nexport default {\n  render() {\n    return (\n      <div>\n        <h2 id=\"contain-jsx-test2\">contain-jsx-test2</h2>\n      </div>\n    );\n  },\n};\n</script>\n"
  ]
}
```

## License

MIT License © 2022-PRESENT [Mr-xzq](https://github.com/Mr-xzq)
