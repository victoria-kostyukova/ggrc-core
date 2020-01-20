/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {convertMarkdownToHtml} from '../../utils/markdown-utils';

describe('markdown-utils', () => {
  describe('convertMarkdownToHtml(value) method', () => {
    const markdownValues = [
      '[pica](https://example.com)',

      '1. Lorem ipsum dolor sit amet\n' +
      '2. Consectetur adipiscing elit\n' +
      '3. Integer molestie lorem at massa\n',

      '**This is bold text**',
    ];

    const htmlValues = [
      '<p><a href="https://example.com">pica</a></p>',

      '<ol>\n' +
      '<li>Lorem ipsum dolor sit amet</li>\n' +
      '<li>Consectetur adipiscing elit</li>\n' +
      '<li>Integer molestie lorem at massa</li>\n' +
      '</ol>',

      '<p><strong>This is bold text</strong></p>',
    ];

    it('returns correct html from markdown', () => {
      markdownValues.forEach((value, index) => {
        expect(convertMarkdownToHtml(value)).toBe(htmlValues[index]);
      });
    });
  });
});
