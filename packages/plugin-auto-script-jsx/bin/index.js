#!/usr/bin/env node
import { getCacheDirName, getCacheFileFullPath, resetByCacheCodeMap } from '../src/cache.js';

// 打印日志
process.env.__logEnabled = true;

const resetIndex = process.argv.findIndex((arg) => /^(?:-R|--reset)$/.test(arg));
let resetValue;
// process.argv:  -1 表示不存在, 0 表示当前执行的 node.exe 完整路径
if (resetIndex > 0) {
  resetValue = process.argv[resetIndex + 1];
  if (resetValue !== 'false') {
    const cacheDirName = getCacheDirName(process.cwd());
    const cacheFileFullPath = getCacheFileFullPath(cacheDirName);
    resetByCacheCodeMap(cacheFileFullPath);
  }
}
