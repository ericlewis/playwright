/**
 * Copyright Microsoft Corporation. All rights reserved.
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


import fs from 'fs';
import path from 'path';

import { escapeTemplateString, isString } from 'playwright-core/lib/utils';

import {  kNoElementsFoundError, matcherHint } from './matcherHint';
import { EXPECTED_COLOR } from '../common/expectBundle';
import { callLogText, fileExistsAsync } from '../util';
import { printReceivedStringContainExpectedSubstring } from './expect';
import { currentTestInfo } from '../common/globals';

import type { MatcherResult } from './matcherHint';
import type { LocatorEx } from './matchers';
import type { ExpectMatcherState } from '../../types/test';
import type { MatcherReceived } from '@injected/ariaSnapshot';


type ToMatchAriaSnapshotExpected = {
  name?: string;
  path?: string;
  timeout?: number;
} | string;

export async function toMatchAriaSnapshot(
  this: ExpectMatcherState,
  receiver: LocatorEx,
  expectedParam?: ToMatchAriaSnapshotExpected,
  options: { timeout?: number } = {},
): Promise<MatcherResult<string | RegExp, string>> {
  const matcherName = 'toMatchAriaSnapshot';

  const testInfo = currentTestInfo();
  if (!testInfo)
    throw new Error(`toMatchAriaSnapshot() must be called during the test`);

  if (testInfo._projectInternal.ignoreSnapshots)
    return { pass: !this.isNot, message: () => '', name: 'toMatchAriaSnapshot', expected: '' };

  const updateSnapshots = testInfo.config.updateSnapshots;

  const matcherOptions = {
    isNot: this.isNot,
    promise: this.promise,
  };

  let expected: string;
  let timeout: number;
  let expectedPath: string | undefined;
  if (isString(expectedParam)) {
    expected = expectedParam;
    timeout = options.timeout ?? this.timeout;
  } else {
    const legacyPath = testInfo._resolveSnapshotPaths('aria', expectedParam?.name, 'dontUpdateSnapshotIndex', '.yml').absoluteSnapshotPath;
    expectedPath = testInfo._resolveSnapshotPaths('aria', expectedParam?.name, 'updateSnapshotIndex').absoluteSnapshotPath;
    // in 1.51, we changed the default template to use .aria.yml extension
    // for backwards compatibility, we check for the legacy .yml extension
    if (!(await fileExistsAsync(expectedPath)) && await fileExistsAsync(legacyPath))
      expectedPath = legacyPath;
    expected = await fs.promises.readFile(expectedPath, 'utf8').catch(() => '');
    timeout = expectedParam?.timeout ?? this.timeout;
  }

  const generateMissingBaseline = updateSnapshots === 'missing' && !expected;
  if (generateMissingBaseline) {
    if (this.isNot) {
      const message = `Matchers using ".not" can't generate new baselines`;
      return { pass: this.isNot, message: () => message, name: 'toMatchAriaSnapshot' };
    } else {
      // When generating new baseline, run entire pipeline against impossible match.
      expected = `- none "Generating new baseline"`;
    }
  }

  expected = unshift(expected);
  
  // Preprocess YAML to automatically quote strings that need it
  expected = preprocessYaml(expected);
  
  let pass: boolean;
  let received: any;
  let log: string[] | undefined;
  let timedOut: boolean | undefined;
  
  try {
    const result = await receiver._expect('to.match.aria', { expectedValue: expected, isNot: this.isNot, timeout });
    pass = result.matches;
    received = result.received;
    log = result.log;
    timedOut = result.timedOut;
  } catch (error: any) {
    // Re-throw the error with a more helpful message if it's a YAML parsing error
    if (error.message && error.message.includes('Nested mappings are not allowed')) {
      throw new Error(`YAML syntax error in aria snapshot: ${error.message}\n\nHint: Strings containing colons need to be quoted, e.g., "Items: 42"`);
    }
    throw error;
  }
  
  const matcherHintWithExpect = (expectedReceivedString: string) => {
    return matcherHint(this, receiver, matcherName, 'locator', undefined, matcherOptions, timedOut ? timeout : undefined, expectedReceivedString);
  };

  const notFound = received === kNoElementsFoundError;
  if (notFound) {
    return {
      pass: this.isNot,
      message: () => matcherHintWithExpect(`Expected: ${this.utils.printExpected(expected)}\nReceived: ${EXPECTED_COLOR('<element not found>')}`) + callLogText(log),
      name: 'toMatchAriaSnapshot',
      expected,
    };
  }

  // Type guard to ensure received is MatcherReceived after notFound check
  const typedReceived = received as MatcherReceived;
  let receivedText: string;

  // Decide which representation of the received snapshot to use in diff. If the assertion passes we
  // can show the raw (pretty-printed) aria tree. If it fails, prefer the regex (best-guess) form so
  // that dynamic portions that are intentionally matched via regular expressions are not highlighted
  // as differences, addressing the confusion reported in issue #34555.
  receivedText = pass ? typedReceived.raw : typedReceived.regex;
  
  const message = () => {
    if (pass) {
      const receivedString = printReceivedStringContainExpectedSubstring(receivedText, receivedText.indexOf(expected), expected.length);
      const expectedReceivedString = `Expected: not ${this.utils.printExpected(expected)}\nReceived: ${receivedString}`;
      return matcherHintWithExpect(expectedReceivedString) + callLogText(log);
    } else {
      const labelExpected = `Expected`;
      const expectedReceivedString = this.utils.printDiffOrStringify(expected, receivedText, labelExpected, 'Received', false);
      return matcherHintWithExpect(expectedReceivedString) + callLogText(log);
    }
  };

  if (!this.isNot) {
    if ((updateSnapshots === 'all') ||
        (updateSnapshots === 'changed' && pass === this.isNot) ||
        generateMissingBaseline) {
      if (expectedPath) {
        await fs.promises.mkdir(path.dirname(expectedPath), { recursive: true });
        await fs.promises.writeFile(expectedPath, typedReceived.regex, 'utf8');
        const relativePath = path.relative(process.cwd(), expectedPath);
        if (updateSnapshots === 'missing') {
          const message = `A snapshot doesn't exist at ${relativePath}, writing actual.`;
          testInfo._hasNonRetriableError = true;
          testInfo._failWithError(new Error(message));
        } else {
          const message = `A snapshot is generated at ${relativePath}.`;
          /* eslint-disable no-console */
          console.log(message);
        }
        return { pass: true, message: () => '', name: 'toMatchAriaSnapshot' };
      } else {
        const suggestedRebaseline = `\`\n${escapeTemplateString(indent(typedReceived.regex, '{indent}  '))}\n{indent}\``;
        if (updateSnapshots === 'missing') {
          const message = 'A snapshot is not provided, generating new baseline.';
          testInfo._hasNonRetriableError = true;
          testInfo._failWithError(new Error(message));
        }
        // TODO: ideally, we should return "pass: true" here because this matcher passes
        // when regenerating baselines. However, we can only access suggestedRebaseline in case
        // of an error, so we fail here and workaround it in the expect implementation.
        return { pass: false, message: () => '', name: 'toMatchAriaSnapshot', suggestedRebaseline };
      }
    }
  }

  return {
    name: matcherName,
    expected,
    message,
    pass,
    actual: received,
    log,
    timeout: timedOut ? timeout : undefined,
  };
}

function unshift(snapshot: string): string {
  const lines = snapshot.split('\n');
  let whitePrefix: string | null = null;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && whitePrefix === null) {
      whitePrefix = line.substring(0, line.length - trimmed.length);
      break;
    }
  }
  return lines.filter(t => t.trim()).map(line => line.substring(whitePrefix!.length)).join('\n');
}

/**
 * Preprocesses YAML to automatically quote strings that need it.
 * This makes the YAML syntax more forgiving for common patterns.
 */
function preprocessYaml(yaml: string): string {
  const lines = yaml.split('\n');
  const processed: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty lines and comments
    if (!line.trim() || line.trim().startsWith('#')) {
      processed.push(line);
      continue;
    }
    
    // Match list items with potential unquoted values
    const listMatch = line.match(/^(\s*)-\s+(.+)$/);
    if (listMatch) {
      const [, indent, content] = listMatch;
      
      // Check if it's a role/element with children (ends with colon)
      if (content.endsWith(':')) {
        // Don't quote role names with children
        processed.push(line);
        continue;
      }
      
      // Check if it's a property syntax (starts with /)
      if (content.startsWith('/')) {
        // Don't quote property syntax like /url: ...
        processed.push(line);
        continue;
      }
      
      // Check if it's a key-value pair (e.g., "paragraph: Items: 42")
      const keyValueMatch = content.match(/^(\w+):\s*(.+)$/);
      if (keyValueMatch) {
        const [, key, value] = keyValueMatch;
        
        // Don't process if it's already a quoted regex pattern
        if (value.match(/^"\/.*\/"$/)) {
          processed.push(line);
          continue;
        }
        
        // Check if the value needs quoting
        if (needsYamlQuoting(value)) {
          processed.push(`${indent}- ${key}: "${escapeYamlString(value)}"`);
        } else {
          processed.push(line);
        }
      } else {
        // It's just a list item value, check if it needs quoting
        if (needsYamlQuoting(content)) {
          processed.push(`${indent}- "${escapeYamlString(content)}"`);
        } else {
          processed.push(line);
        }
      }
    } else {
      processed.push(line);
    }
  }
  
  return processed.join('\n');
}

function needsYamlQuoting(str: string): boolean {
  // Strings that contain colon followed by space are problematic in YAML
  if (str.includes(': '))
    return true;
  
  // Also quote strings with percent signs as they can cause issues
  if (str.includes('%'))
    return true;
    
  return false;
}

function escapeYamlString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

function indent(snapshot: string, indent: string): string {
  return snapshot.split('\n').map(line => indent + line).join('\n');
}
