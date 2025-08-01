/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { expect, test } from './ui-mode-fixtures';

test('should filter network requests by resource type', async ({ runUITest, server }) => {
  server.setRoute('/api/endpoint', (_, res) => res.setHeader('Content-Type', 'application/json').end());

  const { page } = await runUITest({
    'network-tab.test.ts': `
      import { test, expect } from '@playwright/test';
      test('network tab test', async ({ page }) => {
        await page.goto('${server.PREFIX}/network-tab/network.html');
        await page.evaluate(() => (window as any).donePromise);
      });
    `,
  });

  await page.getByText('network tab test').dblclick();
  await page.getByText('Network', { exact: true }).click();

  const networkItems = page.getByRole('list', { name: 'Network requests' }).getByRole('listitem');

  await page.getByText('JS', { exact: true }).click();
  await expect(networkItems).toHaveCount(1);
  await expect(networkItems.getByText('script.js')).toBeVisible();

  await page.getByText('CSS', { exact: true }).click();
  await expect(networkItems).toHaveCount(1);
  await expect(networkItems.getByText('style.css')).toBeVisible();

  await page.getByText('Image', { exact: true }).click();
  await expect(networkItems).toHaveCount(1);
  await expect(networkItems.getByText('image.png')).toBeVisible();

  await page.getByText('Fetch', { exact: true }).click();
  await expect(networkItems).toHaveCount(1);
  await expect(networkItems.getByText('endpoint')).toBeVisible();

  await page.getByText('HTML', { exact: true }).click();
  await expect(networkItems).toHaveCount(1);
  await expect(networkItems.getByText('network.html')).toBeVisible();

  await page.getByText('Font', { exact: true }).click();
  await expect(networkItems).toHaveCount(1);
  await expect(networkItems.getByText('font.woff2')).toBeVisible();
});

test('should filter network requests by url', async ({ runUITest, server }) => {
  const { page } = await runUITest({
    'network-tab.test.ts': `
      import { test, expect } from '@playwright/test';
      test('network tab test', async ({ page }) => {
        await page.goto('${server.PREFIX}/network-tab/network.html');
        await page.evaluate(() => (window as any).donePromise);
      });
    `,
  });

  await page.getByText('network tab test').dblclick();
  await page.getByText('Network', { exact: true }).click();

  const networkItems = page.getByRole('list', { name: 'Network requests' }).getByRole('listitem');

  await page.getByPlaceholder('Filter network').fill('script.');
  await expect(networkItems).toHaveCount(1);
  await expect(networkItems.getByText('script.js')).toBeVisible();

  await page.getByPlaceholder('Filter network').fill('png');
  await expect(networkItems).toHaveCount(1);
  await expect(networkItems.getByText('image.png')).toBeVisible();

  await page.getByPlaceholder('Filter network').fill('api/');
  await expect(networkItems).toHaveCount(1);
  await expect(networkItems.getByText('endpoint')).toBeVisible();

  await page.getByPlaceholder('Filter network').fill('End');
  await expect(networkItems).toHaveCount(1);
  await expect(networkItems.getByText('endpoint')).toBeVisible();

  await page.getByPlaceholder('Filter network').fill('FON');
  await expect(networkItems).toHaveCount(1);
  await expect(networkItems.getByText('font.woff2')).toBeVisible();
});

test('should format JSON request body', async ({ runUITest, server }) => {
  const { page } = await runUITest({
    'network-tab.test.ts': `
      import { test, expect } from '@playwright/test';
      test('network tab test', async ({ page }) => {
        await page.goto('${server.PREFIX}/network-tab/network.html');
        await page.evaluate(() => (window as any).donePromise);
      });
    `,
  });

  await page.getByText('network tab test').dblclick();
  await page.getByText('Network', { exact: true }).click();

  await page.getByText('post-data-1').click();

  await expect(page.locator('.CodeMirror-code .CodeMirror-line')).toHaveText([
    '{',
    '  "data": {',
    '    "key": "value",',
    '    "array": [',
    '      "value-1",',
    '      "value-2"',
    '    ]',
    '  }',
    '}',
  ], { useInnerText: true });

  await page.getByText('post-data-2').click();

  await expect(page.locator('.CodeMirror-code .CodeMirror-line')).toHaveText([
    '{',
    '  "data": {',
    '    "key": "value",',
    '    "array": [',
    '      "value-1",',
    '      "value-2"',
    '    ]',
    '  }',
    '}',
  ], { useInnerText: true });
});

test('should display list of query parameters (only if present)', async ({ runUITest, server }) => {
  const { page } = await runUITest({
    'network-tab.test.ts': `
      import { test, expect } from '@playwright/test';
      test('network tab test', async ({ page }) => {
        await page.goto('${server.PREFIX}/network-tab/network.html');
        await page.evaluate(() => (window as any).donePromise);
      });
    `,
  });

  await page.getByText('network tab test').dblclick();
  await page.getByText('Network', { exact: true }).click();

  await page.getByText('call-with-query-params').click();

  await expect(page.getByText('Query String Parameters')).toBeVisible();
  await expect(page.getByText('param1: value1')).toBeVisible();
  await expect(page.getByText('param1: value2')).toBeVisible();
  await expect(page.getByText('param2: value2')).toBeVisible();

  await page.getByText('endpoint').click();

  await expect(page.getByText('Query String Parameters')).not.toBeVisible();
});

test('should not duplicate network entries from beforeAll', {
  annotation: [
    { type: 'issue', description: 'https://github.com/microsoft/playwright/issues/34404' },
    { type: 'issue', description: 'https://github.com/microsoft/playwright/issues/33106' },
  ]
}, async ({ runUITest, server }) => {
  const { page } = await runUITest({
    'playwright.config.ts': `
      module.exports = { use: { trace: 'on' } };
    `,
    'a.spec.ts': `
      import { test as base, expect, request, type APIRequestContext } from '@playwright/test';

      const test = base.extend<{}, { apiRequest: APIRequestContext }>({
        apiRequest: [async ({ }, use) => {
          const apiContext = await request.newContext();
          await use(apiContext);
          await apiContext.dispose();
        }, { scope: 'worker' }]
      });

      test.beforeAll(async ({ apiRequest }) => {
        await apiRequest.get("${server.EMPTY_PAGE}");
      });

      test('first test', async ({ }) => { });

      test.afterAll(async ({ apiRequest }) => { });
    `,
  });

  await page.getByText('first test').dblclick();
  await page.getByText('Network', { exact: true }).click();
  await expect(page.getByRole('list', { name: 'Network requests' }).getByText('empty.html')).toHaveCount(1);
});
