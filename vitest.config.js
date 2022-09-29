import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

const timeout = 30000;

export default defineConfig({
  resolve: {
    alias: {
      '~playground': resolve(__dirname, './playground'),
    },
  },
  test: {
    include: ['./playground/**/*.spec.[tj]s'],
    setupFiles: ['./playground/vitestSetup.js'],
    testTimeout: timeout,
    hookTimeout: timeout,
    globals: true,
    // TODO 并行执行测试的时候, 全局的 dev-server 会冲突, 还没想好怎么控制
    threads: false,
  },
  esbuild: {
    target: 'node14',
  },
});
