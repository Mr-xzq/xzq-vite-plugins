import { resolve } from 'node:path';
import fs from 'fs-extra';
import { log } from './utils.js';

export const getCacheDirName = (rootDirName = process.cwd(), targetDirName = 'node_modules/.vue-auto-script-jsx') => {
  return resolve(rootDirName, targetDirName);
};

export const getCacheFileFullPath = (cacheDir, cacheFileName = 'cache.json') => {
  return resolve(cacheDir, cacheFileName);
};

export const writeCacheFileToJson = (fullPath, data) => {
  let content = typeof data === 'string' ? data : JSON.stringify(data);

  if (!fs.existsSync(fullPath)) {
    fs.createFileSync(fullPath);
  }

  fs.writeFileSync(fullPath, content, { encoding: 'utf-8' });
};

export const readCacheFileAsObj = (fullPath) => {
  if (!fs.existsSync(fullPath)) return {};
  const cacheFileContent = fs.readFileSync(fullPath, { encoding: 'utf-8' }) || '{}';
  return JSON.parse(cacheFileContent);
};

export const resetByCacheCodeMap = (currentCacheFileFullPath, currentCacheCodeMap) => {
  if (!currentCacheFileFullPath) return;

  currentCacheCodeMap = currentCacheCodeMap ?? readCacheFileAsObj(currentCacheFileFullPath);
  if (!currentCacheCodeMap) return;

  const cacheCodeMapEntries = Object.entries(currentCacheCodeMap);

  if (!cacheCodeMapEntries.length) return;

  for (const [filePath, codeRecordsArr] of cacheCodeMapEntries) {
    if (!codeRecordsArr?.length) return;

    const originCode = codeRecordsArr[0];

    log(`还原路径为: ${filePath}`);
    log(`还原内容为:\n ${originCode}`);

    // 只要涉及到修改原始文件的代码, 都需要记录操作
    fs.writeFileSync(filePath, originCode, { encoding: 'utf-8' });
    codeRecordsArr.push(originCode);
  }

  writeCacheFileToJson(currentCacheFileFullPath, currentCacheCodeMap);
};
