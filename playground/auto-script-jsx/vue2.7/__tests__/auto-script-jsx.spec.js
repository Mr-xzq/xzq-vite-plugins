import { page } from '~playground/test-utils.js';

test('has lang = "jsx"', async () => {
  const textContent1 = await page.locator('#contain-jsx-test1').textContent();
  expect(textContent1).toBe('contain-jsx-test1');

  const textContent2 = await page.locator('#contain-jsx-test2').textContent();
  expect(textContent2).toBe('contain-jsx-test2');
});
