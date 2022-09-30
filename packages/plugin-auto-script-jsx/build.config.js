import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  outDir: 'dist',
  // 要注意: 如果你写 src/index.js 那么打包出来的文件就变成了 index.js.cjs index.js.mjs..
  entries: ['src/index'],
  // 将 vite 移除到打包的内容中有两种做法:
  // 1. 配置 externals
  // 2. 将其声明为 peerDependencies

  // 为什么要将 vite 移除到打的包中:
  // 1. 减小包的体积
  // 2. vite 如果作为第三方依赖打包进 npm 库中, 而不是作为开发服务使用的话, 那么很可能会出现奇怪的问题
  // 比如: 里面会用到 CLIENT_ENTRY 这种依赖客户端的东西, 在打包的环境显然是没有的
  // externals: ['vite'],
  clean: true,
  rollup: {
    emitCJS: true,
    inlineDependencies: true,
  },
});
