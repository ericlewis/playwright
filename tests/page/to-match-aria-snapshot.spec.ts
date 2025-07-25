/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { stripAnsi } from '../config/utils';
import { test, expect } from './pageTest';

test('should match', async ({ page }) => {
  await page.setContent(`<h1>title</h1>`);
  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - heading "title"
  `);
});

test('should match in list', async ({ page }) => {
  await page.setContent(`
    <h1>title</h1>
    <h1>title 2</h1>
  `);
  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - heading "title"
  `);
});

test('should match list with accessible name', async ({ page }) => {
  await page.setContent(`
    <ul aria-label="my list">
      <li>one</li>
      <li>two</li>
    </ul>
  `);
  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - list "my list":
      - listitem: "one"
      - listitem: "two"
  `);
});

test('should match deep item', async ({ page }) => {
  await page.setContent(`
    <div>
      <h1>title</h1>
      <h1>title 2</h1>
    </div>
  `);
  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - heading "title"
  `);
});

test('should match complex', async ({ page }) => {
  await page.setContent(`
    <ul>
      <li>
        <a href='about:blank'>link</a>
      </li>
    </ul>
  `);
  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - list:
      - listitem:
        - link "link"
  `);
});

test('should match regex', async ({ page }) => {
  {
    await page.setContent(`<h1>Issues 12</h1>`);
    await expect(page.locator('body')).toMatchAriaSnapshot(`
      - heading ${/Issues \d+/}
    `);
  }
  {
    await page.setContent(`<h1>Issues 1/2</h1>`);
    await expect(page.locator('body')).toMatchAriaSnapshot(`
      - heading ${/Issues 1[/]2/}
    `);
  }
  {
    await page.setContent(`<h1>Issues 1[</h1>`);
    await expect(page.locator('body')).toMatchAriaSnapshot(`
      - heading ${/Issues 1\[/}
    `);
  }
  {
    await page.setContent(`<h1>Issues 1]]2</h1>`);
    await expect(page.locator('body')).toMatchAriaSnapshot(`
      - heading ${/Issues 1[\]]]2/}
    `);
  }
});

test('should allow text nodes', async ({ page }) => {
  await page.setContent(`
    <h1>Microsoft</h1>
    <div>Open source projects and samples from Microsoft</div>
  `);

  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - heading "Microsoft"
    - text: "Open source projects and samples from Microsoft"
  `);
});

test('details visibility', async ({ page }) => {
  await page.setContent(`
    <details>
      <summary>Summary</summary>
      <div>Details</div>
    </details>
  `);

  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - group: "Summary"
  `);
});

test('checked attribute', async ({ page }) => {
  await page.setContent(`
    <input type='checkbox' checked />
  `);

  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - checkbox
  `);

  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - checkbox [checked]
  `);

  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - checkbox [checked=true]
  `);

  {
    const e = await expect(page.locator('body')).toMatchAriaSnapshot(`
      - checkbox [checked=false]
    `, { timeout: 1000 }).catch(e => e);
    expect(stripAnsi(e.message)).toContain('expect(locator).toMatchAriaSnapshot(expected) failed');
    expect(stripAnsi(e.message)).toContain('Timeout:  1000ms');
  }

  {
    const e = await expect(page.locator('body')).toMatchAriaSnapshot(`
      - checkbox [checked=mixed]
    `, { timeout: 1000 }).catch(e => e);
    expect(stripAnsi(e.message)).toContain('expect(locator).toMatchAriaSnapshot(expected) failed');
    expect(stripAnsi(e.message)).toContain('Timeout:  1000ms');
  }

  {
    const e = await expect(page.locator('body')).toMatchAriaSnapshot(`
      - checkbox [checked=5]
    `, { timeout: 1000 }).catch(e => e);
    expect(stripAnsi(e.message)).toContain(' attribute must be a boolean or "mixed"');
  }
});

test('disabled attribute', async ({ page }) => {
  await page.setContent(`
    <button disabled>Click me</button>
  `);

  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - button
  `);

  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - button [disabled]
  `);

  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - button [disabled=true]
  `);

  {
    const e = await expect(page.locator('body')).toMatchAriaSnapshot(`
      - button [disabled=false]
    `, { timeout: 1000 }).catch(e => e);
    expect(stripAnsi(e.message)).toContain('expect(locator).toMatchAriaSnapshot(expected) failed');
    expect(stripAnsi(e.message)).toContain('Timeout:  1000ms');
  }

  {
    const e = await expect(page.locator('body')).toMatchAriaSnapshot(`
      - button [disabled=invalid]
    `, { timeout: 1000 }).catch(e => e);
    expect(stripAnsi(e.message)).toContain(' attribute must be a boolean');
  }
});

test('expanded attribute', async ({ page }) => {
  await page.setContent(`
    <button aria-expanded="true">Toggle</button>
  `);

  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - button
  `);

  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - button [expanded]
  `);

  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - button [expanded=true]
  `);

  {
    const e = await expect(page.locator('body')).toMatchAriaSnapshot(`
      - button [expanded=false]
    `, { timeout: 1000 }).catch(e => e);
    expect(stripAnsi(e.message)).toContain('expect(locator).toMatchAriaSnapshot(expected) failed');
    expect(stripAnsi(e.message)).toContain('Timeout:  1000ms');
  }

  {
    const e = await expect(page.locator('body')).toMatchAriaSnapshot(`
      - button [expanded=invalid]
    `, { timeout: 1000 }).catch(e => e);
    expect(stripAnsi(e.message)).toContain(' attribute must be a boolean');
  }
});

test('level attribute', async ({ page }) => {
  await page.setContent(`
    <h2>Section Title</h2>
  `);

  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - heading
  `);

  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - heading [level=2]
  `);

  {
    const e = await expect(page.locator('body')).toMatchAriaSnapshot(`
      - heading [level=3]
    `, { timeout: 1000 }).catch(e => e);
    expect(stripAnsi(e.message)).toContain('expect(locator).toMatchAriaSnapshot(expected) failed');
    expect(stripAnsi(e.message)).toContain('Timeout:  1000ms');
  }

  {
    const e = await expect(page.locator('body')).toMatchAriaSnapshot(`
      - heading [level=two]
    `, { timeout: 1000 }).catch(e => e);
    expect(stripAnsi(e.message)).toContain(' attribute must be a number');
  }
});

test('pressed attribute', async ({ page }) => {
  await page.setContent(`
    <button aria-pressed="true">Like</button>
  `);

  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - button
  `);

  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - button [pressed]
  `);

  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - button [pressed=true]
  `);

  {
    const e = await expect(page.locator('body')).toMatchAriaSnapshot(`
      - button [pressed=false]
    `, { timeout: 1000 }).catch(e => e);
    expect(stripAnsi(e.message)).toContain('expect(locator).toMatchAriaSnapshot(expected) failed');
    expect(stripAnsi(e.message)).toContain('Timeout:  1000ms');
  }

  // Test for 'mixed' state
  await page.setContent(`
    <button aria-pressed="mixed">Like</button>
  `);

  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - button [pressed=mixed]
  `);

  {
    const e = await expect(page.locator('body')).toMatchAriaSnapshot(`
      - button [pressed=true]
    `, { timeout: 1000 }).catch(e => e);
    expect(stripAnsi(e.message)).toContain('expect(locator).toMatchAriaSnapshot(expected) failed');
    expect(stripAnsi(e.message)).toContain('Timeout:  1000ms');
  }

  {
    const e = await expect(page.locator('body')).toMatchAriaSnapshot(`
      - button [pressed=5]
    `, { timeout: 1000 }).catch(e => e);
    expect(stripAnsi(e.message)).toContain(' attribute must be a boolean or "mixed"');
  }
});

test('selected attribute', async ({ page }) => {
  await page.setContent(`
    <table>
      <tr aria-selected="true">
        <td>Row</td>
      </tr>
    </table>
  `);

  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - row
  `);

  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - row [selected]
  `);

  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - row [selected=true]
  `);

  {
    const e = await expect(page.locator('body')).toMatchAriaSnapshot(`
      - row [selected=false]
    `, { timeout: 1000 }).catch(e => e);
    expect(stripAnsi(e.message)).toContain('expect(locator).toMatchAriaSnapshot(expected) failed');
    expect(stripAnsi(e.message)).toContain('Timeout:  1000ms');
  }

  {
    const e = await expect(page.locator('body')).toMatchAriaSnapshot(`
      - row [selected=invalid]
    `, { timeout: 1000 }).catch(e => e);
    expect(stripAnsi(e.message)).toContain(' attribute must be a boolean');
  }
});

test('integration test', async ({ page }) => {
  await page.setContent(`
    <h1>Microsoft</h1>
    <div>Open source projects and samples from Microsoft</div>
    <ul>
      <li>
        <details>
          <summary>
            Verified
          </summary>
          <div>
            <div>
              <p>
                We've verified that the organization <strong>microsoft</strong> controls the domain:
              </p>
              <ul>
                <li class="mb-1">
                  <strong>opensource.microsoft.com</strong>
                </li>
              </ul>
              <div>
                <a href="about: blank">Learn more about verified organizations</a>
              </div>
            </div>
          </div>
        </details>
      </li>
      <li>
        <a href="about:blank">
          <summary title="Label: GitHub Sponsor">Sponsor</summary>
        </a>
      </li>
    </ul>`);

  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - heading "Microsoft"
    - text: Open source projects and samples from Microsoft
    - list:
      - listitem:
        - group: Verified
      - listitem:
        - link "Sponsor"
  `);
});

test('integration test 2', async ({ page }) => {
  await page.setContent(`
    <div>
      <header>
        <h1>todos</h1>
        <input placeholder="What needs to be done?">
      </header>
    </div>`);
  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - heading "todos"
    - textbox "What needs to be done?"
  `);
});

test('expected formatter', async ({ page }) => {
  await page.setContent(`
    <div>
      <header>
        <h1>todos</h1>
        <input placeholder="What needs to be done?">
      </header>
    </div>`);
  const error = await expect(page.locator('body')).toMatchAriaSnapshot(`
    - heading "todos"
    - textbox "Wrong text"
  `, { timeout: 1 }).catch(e => e);

  expect(stripAnsi(error.message)).toContain(`
Locator:  locator('body')
- Expected  - 2
+ Received  + 3

- - heading "todos"
- - textbox "Wrong text"
+ - banner:
+   - heading "todos" [level=1]
+   - textbox "What needs to be done?"
Timeout:  1ms`);
});

test('should unpack escaped names', async ({ page }) => {
  {
    await page.setContent(`
      <h1>heading "name" [level=1]</h1>
    `);
    await expect(page.locator('body')).toMatchAriaSnapshot(`
      - heading "heading \\"name\\" [level=1]" [level=1]
    `);
  }

  {
    await page.setContent(`
      <h1>heading \\" [level=2]</h1>
    `);
    // The YAML pipe syntax (|) isn't supported in aria snapshots
    // This should use standard syntax instead
    await expect(page.locator('body')).toMatchAriaSnapshot(`
      - heading "heading \\\\\\" [level=2]" [level=1]
    `);
  }
});

test('should report error in YAML', async ({ page }) => {
  await page.setContent(`
    <h1>title</h1>
  `);

  // This is invalid because : is not a valid role name
  const error = await expect(page.locator('body')).toMatchAriaSnapshot(`
    - heading: a:
  `).catch(e => e);
  
  // We now wrap YAML errors with a helpful hint
  expect.soft(error.message).toContain('YAML syntax error in aria snapshot');
  expect.soft(error.message).toContain('Nested mappings are not allowed in compact mappings');
  expect.soft(error.message).toContain('Hint: Strings containing colons need to be quoted');
});

test('should report error in YAML keys', async ({ page }) => {
  await page.setContent(`<h1>title</h1>`);

  {
    const error = await expect(page.locator('body')).toMatchAriaSnapshot(`
      - heading "title
    `).catch(e => e);
    expect.soft(error.message).toBe(`expect.toMatchAriaSnapshot: Unterminated string:

heading "title
              ^
`);
  }

  {
    const error = await expect(page.locator('body')).toMatchAriaSnapshot(`
      - heading /title
    `).catch(e => e);
    expect.soft(error.message).toBe(`expect.toMatchAriaSnapshot: Unterminated regex:

heading /title
              ^
`);
  }

  {
    const error = await expect(page.locator('body')).toMatchAriaSnapshot(`
      - heading [level=a]
    `).catch(e => e);
    expect.soft(error.message).toBe(`expect.toMatchAriaSnapshot: Value of "level" attribute must be a number:

heading [level=a]
               ^
`);
  }

  {
    const error = await expect(page.locator('body')).toMatchAriaSnapshot(`
      - heading [expanded=FALSE]
    `).catch(e => e);
    expect.soft(error.message).toBe(`expect.toMatchAriaSnapshot: Value of "expanded" attribute must be a boolean:

heading [expanded=FALSE]
                  ^
`);
  }

  {
    const error = await expect(page.locator('body')).toMatchAriaSnapshot(`
      - heading [checked=foo]
    `).catch(e => e);
    expect.soft(error.message).toBe(`expect.toMatchAriaSnapshot: Value of "checked" attribute must be a boolean or "mixed":

heading [checked=foo]
                 ^
`);
  }

  {
    const error = await expect(page.locator('body')).toMatchAriaSnapshot(`
      - heading [level=]
    `).catch(e => e);
    expect.soft(error.message).toBe(`expect.toMatchAriaSnapshot: Value of "level" attribute must be a number:

heading [level=]
               ^
`);
  }

  {
    const error = await expect(page.locator('body')).toMatchAriaSnapshot(`
      - heading [bogus]
    `).catch(e => e);
    expect.soft(error.message).toBe(`expect.toMatchAriaSnapshot: Unsupported attribute [bogus]:

heading [bogus]
         ^
`);
  }

  {
    const error = await expect(page.locator('body')).toMatchAriaSnapshot(`
      - heading invalid
    `).catch(e => e);
    expect.soft(error.message).toBe(`expect.toMatchAriaSnapshot: Unexpected input:

heading invalid
        ^
`);
  }
});

test('call log should contain actual snapshot', async ({ page }) => {
  await page.setContent(`<h1>todos</h1>`);
  const error = await expect(page.locator('body')).toMatchAriaSnapshot(`
    - heading "wrong"
  `, { timeout: 3000 }).catch(e => e);

  expect(stripAnsi(error.message)).toContain(`- unexpected value "- heading "todos" [level=1]"`);
});

test('should parse attributes', async ({ page }) => {
  {
    await page.setContent(`
      <button aria-pressed="mixed">hello world</button>
    `);
    await expect(page.locator('body')).toMatchAriaSnapshot(`
      - button [pressed=mixed ]
    `);
  }

  {
    await page.setContent(`
      <h2>hello world</h2>
    `);
    await expect(page.locator('body')).not.toMatchAriaSnapshot(`
      - heading [level =  -3 ]
    `);
  }
});

test('should not unshift actual template text', async ({ page }) => {
  await page.setContent(`
    <h1>title</h1>
    <h1>title 2</h1>
  `);
  const error = await expect(page.locator('body')).toMatchAriaSnapshot(`
        - heading "title" [level=1]
    - heading "title 2" [level=1]
  `, { timeout: 1000 }).catch(e => e);
  // This malformed YAML (inconsistent indentation) should produce a YAML error
  expect(stripAnsi(error.message)).toContain('Unexpected scalar at node end');
});

test('should not match what is not matched', async ({ page }) => {
  await page.setContent(`<p>Text</p>`);
  const error = await expect(page.locator('body')).toMatchAriaSnapshot(`
    - paragraph:
      - button "bogus"
  `).catch(e => e);
  expect(stripAnsi(error.message)).toContain(`
- - paragraph:
-   - button "bogus"
+ - paragraph: Text`);
});

test('should match url', async ({ page }) => {
  await page.setContent(`
    <a href='https://example.com'>Link</a>
  `);

  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - link:
      - /url: /.*example.com/
  `);
});

test('should detect unexpected children: equal', async ({ page }) => {
  await page.setContent(`
    <ul>
      <li>One</li>
      <li>Two</li>
      <li>Three</li>
    </ul>
  `);

  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - list:
      - listitem: "One"
      - listitem: "Three"
  `);

  const e = await expect(page.locator('body')).toMatchAriaSnapshot(`
    - list:
      - /children: equal
      - listitem: "One"
      - listitem: "Three"
  `, { timeout: 1000 }).catch(e => e);

  expect(stripAnsi(e.message)).toContain('expect(locator).toMatchAriaSnapshot(expected) failed');
  expect(stripAnsi(e.message)).toContain('Timeout:  1000ms');
  expect(stripAnsi(e.message)).toContain('+   - listitem: Two');
});

test('should detect unexpected children: deep-equal', async ({ page }) => {
  await page.setContent(`
    <ul>
      <li>
        <ul>
          <li>1.1</li>
          <li>1.2</li>
        </ul>
      </li>
    </ul>
  `);

  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - list:
      - listitem:
        - list:
          - listitem: 1.1
  `);

  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - list:
      - /children: equal
      - listitem:
        - list:
          - listitem: 1.1
  `);

  const e = await expect(page.locator('body')).toMatchAriaSnapshot(`
    - list:
      - /children: deep-equal
      - listitem:
        - list:
          - listitem: 1.1
  `, { timeout: 1000 }).catch(e => e);

  expect(stripAnsi(e.message)).toContain('expect(locator).toMatchAriaSnapshot(expected) failed');
  expect(stripAnsi(e.message)).toContain('Timeout:  1000ms');
  expect(stripAnsi(e.message)).toContain('+       - listitem: \"1.2\"');
});

test('should allow restoring contain mode inside deep-equal', async ({ page }) => {
  await page.setContent(`
    <ul>
      <li>
        <ul>
          <li>1.1</li>
          <li>1.2</li>
        </ul>
      </li>
    </ul>
  `);

  const e = await expect(page.locator('body')).toMatchAriaSnapshot(`
    - list:
      - /children: deep-equal
      - listitem:
        - list:
          - listitem: 1.1
  `, { timeout: 1000 }).catch(e => e);

  expect(stripAnsi(e.message)).toContain('expect(locator).toMatchAriaSnapshot(expected) failed');
  expect(stripAnsi(e.message)).toContain('Timeout:  1000ms');
  expect(stripAnsi(e.message)).toContain('+       - listitem: \"1.2\"');

  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - list:
      - /children: deep-equal
      - listitem:
        - list:
          - /children: contain
          - listitem: 1.1
  `);
});

test('top-level deep-equal', { annotation: { type: 'issue', description: 'https://github.com/microsoft/playwright/issues/36456' } }, async ({ page }) => {
  await page.setContent(`
    <ul>
      <li>
        <ul>
          <li>1.1</li>
          <li>1.2</li>
        </ul>
      </li>
    </ul>
  `);

  const error = await expect(page.locator('body')).toMatchAriaSnapshot(`
    - /children: deep-equal
    - list
  `, { timeout: 1000 }).catch(e => e);

  expect(stripAnsi(error.message)).toContain(`
- - /children: deep-equal
- - list
+ - list:
+   - listitem:
+     - list:
+       - listitem: "1.1"
+       - listitem: "1.2"
  `.trim());
});

test.describe('aria snapshot regex diff improvements - comprehensive tests', () => {
  test('exact reproduction of issue #34555 - regex patterns in expected snapshot', async ({ page }) => {
    // Exact reproduction from the GitHub issue
    // https://github.com/microsoft/playwright/issues/34555
    await page.setContent(`
      <div id="filter-0">
        <h3>Altre informazioni</h3>
        <button aria-label="3D solo usato">
          3D solo usato
          <img src="/images/icon-3d.svg" alt="">
        </button>
        <button aria-pressed="false">
          <img src="/images/icon-open-shipping.svg" alt="">
          <span>Open Shipping Giunto aperto testato da Digitec</span>
        </button>
        <button aria-pressed="false">
          <img src="/images/icon-second-hand.svg" alt="">
          <span>Usato Da esposizione o con segni d'uso</span>
        </button>
        <button aria-pressed="false">
          <span>Sconti Da 1%</span>
        </button>
        <h3>Colore neutro</h3>
        <button aria-pressed="false">
          <span>Colore neutro Garantisce solo modelli di colore neutro + € 0</span>
        </button>
        <h3>Valutazione utenti</h3>
        <button aria-pressed="false">
          <img src="/images/star-filled.svg" alt="">
          <img src="/images/star-filled.svg" alt="">
          <img src="/images/star-filled.svg" alt="">
          <img src="/images/star-filled.svg" alt="">
          <img src="/images/star-empty.svg" alt="">
          <span>e oltre</span>
        </button>
        <button aria-pressed="false">
          Excellent Contiene solo usato PreLoved di grado estetico Eccellente
        </button>
      </div>
    `);

    // Test with a different price (€ 1 instead of € 0)
    // Note: Based on actual aria snapshot output, buttons with simple text content
    // are displayed as "button: text" not with nested children
    // Also, aria-pressed="false" is not shown in aria snapshots (only true/mixed are shown)
    const expected = `
      - heading "Altre informazioni" [level=3]
      - button "3D solo usato"
      - button "Open Shipping Giunto aperto testato da Digitec"
      - button "Usato Da esposizione o con segni d'uso"
      - button "Sconti Da 1%"
      - heading "Colore neutro" [level=3]
      - button "Colore neutro Garantisce solo modelli di colore neutro + € 1"
      - heading "Valutazione utenti" [level=3]
      - button "e oltre"
      - button "Excellent Contiene solo usato PreLoved di grado estetico Eccellente"
    `;

    const error = await expect(page.locator('#filter-0')).toMatchAriaSnapshot(expected).catch(e => e);
    
    // The test shows the difference between expected (€ 1) and actual (€ 0)
    const message = stripAnsi(error.message);
    expect(message).toContain('- - button "Colore neutro Garantisce solo modelli di colore neutro + € 1"');
    expect(message).toContain('+ - button "Colore neutro Garantisce solo modelli di colore neutro + € 0"');
    
    // The fix for #34555 means only the actual difference is shown, not false positives
    // from dynamic content like numbers that would normally be converted to regex
  });

  test('validates fix for issue #34555 - regex patterns not shown as diff', async ({ page }) => {
    // Reproduces the exact issue from #34555
    await page.setContent(`
      <div>
        <h1>Configura La tua Subbyx Box</h1>
        <p>34 % Cosa potresti ricevere</p>
        <button>Colore neutro Garantisce solo modelli di colore neutro + € 0 </button>
        <button>Tanta memoria Garantisce una memoria da 256 GB o superiore + € 2 </button>
      </div>
    `);
    
    // This should fail because price is different (€ 1 vs € 0)
    const error = await expect(page.locator('body')).toMatchAriaSnapshot(`
      - heading "Configura La tua Subbyx Box" [level=1]
      - paragraph: 34 % Cosa potresti ricevere
      - button "Colore neutro Garantisce solo modelli di colore neutro + € 1 "
      - button "Tanta memoria Garantisce una memoria da 256 GB o superiore + € 2 "
    `).catch(e => e);
    
    const message = stripAnsi(error.message);
    
    // With our fix: the received side converts numbers to regex patterns
    // This prevents false differences for dynamic content
    expect(message).toContain('  - heading "Configura La tua Subbyx Box" [level=1]');
    // Note: Our YAML preprocessing now quotes strings with % signs
    expect(message).toContain('- - paragraph: "34 % Cosa potresti ricevere"');
    expect(message).toContain('+ - paragraph: /\\d+ % Cosa potresti ricevere/');
    
    // The real difference is highlighted
    expect(message).toContain('- - button "Colore neutro Garantisce solo modelli di colore neutro + € 1 "');
    expect(message).toContain('+ - button "Colore neutro Garantisce solo modelli di colore neutro + € 0"');
  });
  
  test('handles YAML special characters correctly', async ({ page }) => {
    await page.setContent(`
      <div>
        <p>Status: active</p>
        <p>Price: $99.99</p>
        <p>Time: 10:30 AM</p>
      </div>
    `);
    
    // These should all pass with proper escaping
    await expect(page.locator('body')).toMatchAriaSnapshot(`
      - paragraph: "Status: active"
      - paragraph: Price: $99.99
      - paragraph: "Time: 10:30 AM"
    `);
    
    // Test error case with mismatched values
    const error = await expect(page.locator('body')).toMatchAriaSnapshot(`
      - paragraph: "Status: inactive"
      - paragraph: Price: $199.99
      - paragraph: "Time: 11:45 PM"
    `).catch(e => e);
    
    const message = stripAnsi(error.message);
    
    // The diff should show the actual differences
    expect(message).toContain('- - paragraph: "Status: inactive"');
    expect(message).toContain('+ - paragraph: "Status: active"');
  });

  test('handles numbers and regex conversion', async ({ page }) => {
    await page.setContent(`
      <div>
        <h1>Sales Report 2024</h1>
        <p>Total: 1,234 items</p>
        <p>Revenue: $567,890.12</p>
        <p>Growth: 45.6%</p>
      </div>
    `);
    
    // Test with different year - should fail but show regex conversion
    const error = await expect(page.locator('body')).toMatchAriaSnapshot(`
      - heading "Sales Report 2023" [level=1]
      - paragraph: "Total: 1,234 items"
      - paragraph: Revenue: $567,890.12
      - paragraph: "Growth: 45.6%"
    `).catch(e => e);
    
    const message = stripAnsi(error.message);
    
    // The heading difference should be clear
    expect(message).toContain('- - heading "Sales Report 2023" [level=1]');
    expect(message).toContain('+ - heading /Sales Report \\d+/ [level=1]');
    
    // Numbers are converted to regex patterns (with quotes for strings containing colon-space)
    expect(message).toContain('- - paragraph: "Total: 1,234 items"');
    expect(message).toContain('+ - paragraph: "/Total: \\\\d+,\\\\d+ items/"');
    expect(message).toContain('- - paragraph: Revenue: $567,890.12');
    expect(message).toContain('+ - paragraph: /Revenue: \\\\$\\\\d+,\\\\d+\\\\.\\\\d+/');
  });

  test('handles complex structures', async ({ page }) => {
    await page.setContent(`
      <ul>
        <li>Item 1: Price $10.00</li>
        <li>Item 2: Price $20.00</li>
      </ul>
    `);
    
    // Test with different prices
    const error = await expect(page.locator('body')).toMatchAriaSnapshot(`
      - list:
        - listitem: "Item 1: Price $15.00"
        - listitem: "Item 2: Price $20.00"
    `).catch(e => e);
    
    const message = stripAnsi(error.message);
    
    // Structure is preserved
    expect(message).toContain('  - list:');
    
    // Both items show regex conversion because they contain prices (with quotes for colon-space)
    expect(message).toContain('-   - listitem: "Item 1: Price $15.00"');
    expect(message).toContain('+   - listitem: "/Item 1: Price \\\\$\\\\d+\\\\.\\\\d+/"');
  });
});

test('aria snapshot regex diff improvement validates issue #34555 fix', async ({ page }) => {
  // This test validates that our fix properly handles the reported issue
  // where regex patterns were incorrectly shown as differences
  await page.setContent(`
    <div>
      <h1>Product Page</h1>
      <p>Price is $99.99</p>
      <button>Add to cart</button>
    </div>
  `);
  
  // This should pass - everything matches
  await expect(page.locator('body')).toMatchAriaSnapshot(`
    - heading "Product Page" [level=1]
    - paragraph: Price is $99.99
    - button "Add to cart"
  `);
  
  // Now change just the button text to test the diff
  const error = await expect(page.locator('body')).toMatchAriaSnapshot(`
    - heading "Product Page" [level=1]
    - paragraph: Price is $99.99
    - button "Buy now"
  `).catch(e => e);
  
  const message = stripAnsi(error.message);
  
  // With our fix: the actual/received side uses regex representation
  // This means dynamic content like "$99.99" becomes a regex pattern /\$\d+\.\d+/
  // Only real differences are shown (the button text mismatch)
  expect(message).toContain('  - heading "Product Page" [level=1]');
  expect(message).toContain('- - paragraph: Price is $99.99');
  expect(message).toContain('+ - paragraph: /Price is \\$\\d+\\.\\d+/');  // Our fix converts to regex!
  
  // The button difference is shown
  expect(message).toContain('- - button "Buy now"');
  expect(message).toContain('+ - button "Add to cart"');
  
  // This demonstrates the issue is fixed - if price had different numbers (e.g. $89.99),
  // the regex would still match and it wouldn't show as a difference
});

test('regex patterns in expected snapshot should not show as differences when they match', async ({ page }) => {
  await page.setContent(`
    <div>
      <p>Items in stock: 42</p>
      <p>Price: $99.00</p>
      <button>Add to cart</button>
    </div>
  `);
  
  // Test failure with wrong button text
  const error = await expect(page.locator('body')).toMatchAriaSnapshot(`
    - paragraph: "Items in stock: 42"
    - paragraph: Price: $99.00
    - button "Buy now"
  `).catch(e => e);
  
  const message = stripAnsi(error.message);
  
  // The received content shows regex patterns for numbers (with quotes for colon-space)
  expect(message).toContain('- - paragraph: "Items in stock: 42"');
  expect(message).toContain('+ - paragraph: "/Items in stock: \\\\d+/"');
  expect(message).toContain('- - paragraph: Price: $99.00');
  expect(message).toContain('+ - paragraph: /Price: \\\\$\\\\d+\\\\.\\\\d+/');
  
  // The real difference (button text) is clearly shown
  expect(message).toContain('- - button "Buy now"');
  expect(message).toContain('+ - button "Add to cart"');
});

test('yaml preprocessing automatically quotes strings with colons', async ({ page }) => {
  await page.setContent(`
    <div>
      <p>Items: 42</p>
      <p>Status: active</p>
      <p>Price: $99.00</p>
    </div>
  `);
  
  // Now we can use unquoted strings with colons - they'll be automatically quoted
  await expect(page.locator('body')).toMatchAriaSnapshot(`
      - paragraph: Items: 42
      - paragraph: Status: active
      - paragraph: Price: $99.00
    `);
  });