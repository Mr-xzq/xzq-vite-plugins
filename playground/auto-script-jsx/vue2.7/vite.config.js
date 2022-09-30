import { resolve } from 'path';
import { defineConfig } from 'vite';
import inspect from 'vite-plugin-inspect';
import vue2Dot7 from '@vitejs/plugin-vue2';
import vue2Dot7Jsx from '@vitejs/plugin-vue2-jsx';
import autoScriptJsxPlugin from 'plugin-auto-script-jsx';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  return {
    root: resolve(__dirname),
    plugins: [
      vue2Dot7(),
      vue2Dot7Jsx(),
      autoScriptJsxPlugin({
        logEnabled: false,
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
    build: {
      // to make tests faster
      minify: false,
    },
  };
});
