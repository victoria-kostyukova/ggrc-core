/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {notifier} from './notifiers-utils';

const invalidProtocolRegex = /^(%20|\s)*(javascript|data)/im;
const ctrlCharactersRegex = /[^\x20-\x7E]/gmi;
const urlSchemeRegex = /^([^:]+):/gm;

const sanitizer = (url) => {
  url = url && url.trim();

  if (!url) {
    notifier('error', 'Please enter a URL.');
    return {isValid: false, value: url};
  }

  let sanitizedUrl = url.replace(ctrlCharactersRegex, '');
  let urlScheme = sanitizedUrl.match(urlSchemeRegex);

  sanitizedUrl = urlScheme &&
    invalidProtocolRegex.test(urlScheme[0]) ? '' : sanitizedUrl;

  let isValid = sanitizedUrl === url;

  if (!isValid) {
    notifier('error',
      'The URL didn\'t pass \'Cross Site Scripting\' validation.');
  }
  return {isValid, value: url};
};

export {
  sanitizer,
};
