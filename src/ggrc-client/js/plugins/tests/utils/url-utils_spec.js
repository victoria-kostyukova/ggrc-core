/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {
  sanitizer,
} from './../../utils/url-utils';

describe('url-utils module', () => {
  let url;

  describe('replaces javascript urls with empty string', () => {
    it('when in the scheme of the URL', () => {
      url = 'javascript:alert(document.domain)';
      expect(sanitizer(url)).toEqual({isValid: false, value: url});
    });

    it('when javascript url begins with %20', () => {
      url = '%20javascript:alert(document.domain)';
      expect(sanitizer(url)).toEqual({isValid: false, value: url});
    });

    it('when javascript url begins with white space', () => {
      url = ' javascript:alert(document.domain)';
      expect(sanitizer(url)).toEqual({isValid: false, value: url.trim()});
    });

    it('when javascript url capitalized', () => {
      url = 'jAvasCrIPT:alert(document.domain)';
      expect(sanitizer(url)).toEqual({isValid: false, value: url});
    });

    it('when javascript url contains ctrl characters', () => {
      url = decodeURIComponent('JaVaScRiP%0at:alert(document.domain)');
      expect(sanitizer(url)).toEqual({isValid: false, value: url});
    });
  });

  describe('does not replace javascript', () => {
    it('when not in the scheme of the URL', () => {
      url = 'http://example.com#myjavascript:foo';
      expect(sanitizer(url)).toEqual({isValid: true, value: url});
    });
  });

  describe('replaces data urls with empty string', () => {
    const script = 'alert(document.domain)';

    it('when in the scheme of the URL', () => {
      url = `data:text/html;base64,PH%3Cscript%3E${script}%3C/script%3E`;
      expect(sanitizer(url)).toEqual({isValid: false, value: url});
    });

    it('when data url begins with %20', () => {
      url = `%20data:text/html;base64,PH%3Cscript%3E${script}%3C/script%3E`;
      expect(sanitizer(url)).toEqual({isValid: false, value: url});
    });

    it('when data url begins with white space', () => {
      url = ` data:text/html;base64,PH%3Cscript%3E${script}%3C/script%3E`;
      expect(sanitizer(url)).toEqual({isValid: false, value: url.trim()});
    });

    it('when data url capitalized', () => {
      url = `dAtA:text/html;base64,PH%3Cscript%3E${script}%3C/script%3E`;
      expect(sanitizer(url)).toEqual({isValid: false, value: url});
    });

    it('when data url contains ctrl characters', () => {
      url = decodeURIComponent(
        `dat%0aa:text/html;base64,PH%3Cscript%3E${script}%3C/script%3E`);
      expect(sanitizer(url)).toEqual({isValid: false, value: url});
    });
  });

  describe('does not alter', () => {
    it('http URLs', () => {
      url = 'http://example.com/path/to:something';
      expect(sanitizer(url)).toEqual({isValid: true, value: url});
    });

    it('http URLs with ports', () => {
      url = 'http://example.com:4567/path/to:something';
      expect(sanitizer(url)).toEqual({isValid: true, value: url});
    });

    it('https URLs', () => {
      url = 'https://example.com';
      expect(sanitizer(url)).toEqual({isValid: true, value: url});
    });

    it('https URLs with ports', () => {
      url = 'https://example.com:4567/path/to:something';
      expect(sanitizer(url)).toEqual({isValid: true, value: url});
    });

    it('absolute-path reference URLs', () => {
      url = '/path/to/my.json';
      expect(sanitizer(url)).toEqual({isValid: true, value: url});
    });

    it('network-path relative URLs', () => {
      url = '//google.com/robots.txt';
      expect(sanitizer(url)).toEqual({isValid: true, value: url});
    });

    it('deep-link urls', () => {
      url = 'com.user://example';
      expect(sanitizer(url)).toEqual({isValid: true, value: url});
    });

    it('mailto urls', () => {
      url = 'mailto:user@example.com?subject=hello+world';
      expect(sanitizer(url)).toEqual({isValid: true, value: url});
    });
  });

  it('replaces blank urls with empty string', () => {
    expect(sanitizer(' ')).toEqual({isValid: false, value: ''});
  });
});
