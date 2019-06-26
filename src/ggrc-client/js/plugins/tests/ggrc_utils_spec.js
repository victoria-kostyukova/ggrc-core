/*
  Copyright (C) 2019 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {
  getTruncatedList,
  getOnlyAnchorTags,
  splitTrim,
} from '../ggrc_utils';

describe('getTruncatedList() util', () => {
  it('returns string which includes 5 lines without last line with count of ' +
  'remaining items if count of items less then 6', () => {
    const items = [
      'email2@something.com',
      'email1@something.com',
      'email3@something.com',
      'email4@something.com',
    ];
    const expected = items.join('\n');

    const result = getTruncatedList(items);

    expect(result).toBe(expected);
  });

  it('returns first 5 items with last line with count of remaining items ' +
  'if count of items less then 6', () => {
    const items = [
      'email2@something.com',
      'email1@something.com',
      'email3@something.com',
      'email4@something.com',
      'email12@something.com',
    ];
    const overflowedItems = [
      ...items,
      'email11@something.com',
      'email13@something.com',
      'email14@something.com',
    ];
    const itemsLimit = 5;
    const expected = items.join('\n') +
      `\n and ${overflowedItems.length - itemsLimit} more`;

    const result = getTruncatedList(overflowedItems);

    expect(result).toBe(expected);
  });
});

describe('getOnlyAnchorTags() util', () => {
  it('returns transformed html content having only anchor tags', () => {
    const html = '<p>my <a href="https://www.example.com">example</a></p>';
    const result = getOnlyAnchorTags(html);

    expect(result)
      .toBe('my <a href="https://www.example.com">example</a>');
  });

  it('returns transformed html with no html tags', () => {
    const html = '<p><strong>sample text</strong></p>';
    const result = getOnlyAnchorTags(html);

    expect(result)
      .toBe('sample text');
  });
});

describe('splitTrim() method', function () {
  describe('Given an string with dots and dot splitter', function () {
    let input = 'a. b. c. d. a. b . . b';
    let splitter = '.';

    it('return split without spaces', function () {
      let result = splitTrim(input, splitter);
      expect(result).toEqual(['a', 'b', 'c', 'd', 'a', 'b', '', 'b']);
    });

    it('return unique values without spaces', function () {
      let result = splitTrim(input, splitter, {
        unique: true,
      });
      expect(result).toEqual(['a', 'b', 'c', 'd', '']);
    });

    it('return compact values without spaces', function () {
      let result = splitTrim(input, splitter, {
        compact: true,
      });
      expect(result).toEqual(['a', 'b', 'c', 'd', 'a', 'b', 'b']);
    });

    it('return compact and uniquee values without spaces', function () {
      let result = splitTrim(input, splitter, {
        unique: true,
        compact: true,
      });
      expect(result).toEqual(['a', 'b', 'c', 'd']);
    });
  });

  describe('Given an string with commas given default splitter', function () {
    let input = 'a,b,c , d ,c,a  b, , , f';

    it('return values without spaces', function () {
      let result = splitTrim(input);
      expect(result).toEqual(['a', 'b', 'c', 'd', 'c', 'a  b', '', '', 'f']);
    });

    it('return unique split values without spaces', function () {
      let result = splitTrim(input, {
        unique: true,
      });
      expect(result).toEqual(['a', 'b', 'c', 'd', 'a  b', '', 'f']);
    });

    it('return compact split values without spaces', function () {
      let result = splitTrim(input, {
        compact: true,
      });
      expect(result).toEqual(['a', 'b', 'c', 'd', 'c', 'a  b', 'f']);
    });

    it('return unique and compact split values without spaces', function () {
      let result = splitTrim(input, {
        compact: true,
        unique: true,
      });
      expect(result).toEqual(['a', 'b', 'c', 'd', 'a  b', 'f']);
    });
  });

  describe('Given no value', function () {
    it('returns empty array', function () {
      let result = splitTrim(undefined);
      expect(result).toEqual([]);
    });
  });
});
