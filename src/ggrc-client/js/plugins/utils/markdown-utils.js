/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import showdown from 'showdown';

const converter = new showdown.Converter();

export function convertMarkdownToHtml(value) {
  return converter.makeHtml(value);
}
