/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loFilter from 'lodash/filter';
/* eslint-disable */
const originalWarn = console.warn;
const originalLog = console.log;
const hiddenWarings = [];
const hiddenLogs = [];

const hideTemplates = [
  'types is deprecated; please use can-types instead',
  'can-component: Assigning a DefineMap or constructor type',
  'No property found for handling',
  'Dispatching a synthetic event on a disabled is problematic in FireFox',
  'canStache/src/expression.js: Unable to find key or helper',
];

const isHidden = function (text) {
  let matched = loFilter(
    hideTemplates,
    (template) => text.includes && text.includes(template)
  );

  return !!matched.length;
};

console.warn = function (text) {
  if (isHidden(text)) {
    hiddenWarings.push(arguments);
    return;
  }

  originalWarn.apply(this, arguments);
};

console.log = function (object) {
  if (isHidden(String(object))) {
    hiddenLogs.push(arguments);
    return;
  }

  originalLog.apply(this, arguments);
};

console.showHiddenWarnings = function () {
  hiddenWarings.forEach((args) => {
    originalWarn.apply(null, args);
  });
};

console.showHiddenLogs = function () {
  hiddenLogs.forEach((args) => {
    originalLog.apply(null, args);
  });
};
