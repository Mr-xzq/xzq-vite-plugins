import { resolve } from 'path';
import { defineConfig } from 'vite';
import inspect from 'vite-plugin-inspect';
import { createVuePlugin as vue2 } from 'vite-plugin-vue2';
import autoScriptJsxPlugin from 'plugin-auto-script-jsx';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  return {
    root: resolve(__dirname),
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
      alias: {
        '@': resolve(__dirname, 'src'),
      },
      // 默认不支持 .vue 扩展名
      // 并非 bug, 而是 vite 设计就是如此: https://github.com/vitejs/vite/issues/178#issuecomment-630138450
      // 配置参考: https://vitejs.bootcss.com/config/#resolve-extensions
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    },
    optimizeDeps: {
      esbuildOptions: {
        // 自定义的预编译的 esbuild 插件调用顺序在内置的之前
        // plugins: [
        //   // {
        //   //   name: "demo",
        //   //   setup(build) {
        //   //     build.onResolve({ filter: /.js/ }, (args) => {
        //   //       console.log("onresolve-args: ", args);
        //   //       return {
        //   //         path: args.path,
        //   //         namespace: "js-demo",
        //   //       };
        //   //     });
        //   //     build.onLoad({ filter: /.*/, namespace: "js-demo" }, (args) => {
        //   //       console.log("onload-args: ", args);
        //   //       return {
        //   //         contents: "xxx",
        //   //       };
        //   //     });
        //   //   },
        //   // },
        // ],
      },
    },
  };
});
