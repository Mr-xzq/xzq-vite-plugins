// 要注意: 如果在 vite 中, 或者 webpack 等打包工具中使用, 构建工具会处理这些不兼容的情况,
// 因此在构建工具中使用随便你怎么写都可以
// 但是在 node 中原生使用就会出现不兼容的情况 --> 比如写单元测试的时候
// 1. Vue2 没有 ES 的对应的具名导出(export { version })
// import { version as VUE_VERSION } from "vue";
// 2. Vue3 没有 ES 的对应的默认导出(export default Vue)
// import Vue from "vue"
// 3. Vue2.7 最完备, 它都兼容(既有 export default Vue, 又有 export {version})
// 4. 在 node 中 ES 默认不支持 json 模块的导入
// import VUE_PKG from "vue/package.json"

export const getVueVersion = async () => {
  let version;
  const vue = await import('vue');
  // 兼容性写法, 兼容 vue2, vue2.7, vue3
  version = vue.default?.version ?? vue.version;

  // if (process.env.VITEST) {
  //   const { createRequire } = await import("node:module");
  //   const require = createRequire(import.meta.url);
  //   const VUE_PKG = require("vue/package.json");
  //   version = VUE_PKG.version;
  // } else {
  //   const vue = await import("vue");
  //   version = vue.default?.version ?? vue.version;
  // }
  return version;
};

const logPrefix = '[vite:vue-auto-script-jsx]  ';
export const log = (...args) => {
  if (process.env.__logEnabled) {
    console.log(logPrefix, ...args);
  }
};
