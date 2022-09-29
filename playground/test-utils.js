import { page } from './vitestSetup.js';

export * from './vitestSetup.js';

const isWindows = process.platform === 'win32';

export const timeout = (n) => new Promise((r) => setTimeout(r, n));

export async function toEl(el) {
  if (typeof el === 'string') {
    return await page.$(el);
  }
  return el;
}
