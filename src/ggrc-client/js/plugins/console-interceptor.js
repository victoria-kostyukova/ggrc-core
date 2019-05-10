/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

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
  'can-stache/src/expression.js: Unable to find key or helper',
];

const isHidden = function (text) {
  let matched = _.filter(
    hideTemplates,
    (template) => text.includes(template)
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

console.log = function (text) {
  if (isHidden(text)) {
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
