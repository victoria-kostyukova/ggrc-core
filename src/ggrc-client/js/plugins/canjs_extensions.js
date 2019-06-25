/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loIsFunction from 'lodash/isFunction';
import loMap from 'lodash/map';
import canModel from 'can-model';
import canList from 'can-list';
import canControl from 'can-control';
import canValidate from 'can-validate-legacy/can-validate';
const originalControlSetup = canControl.setup;
const originListReplace = canList.prototype.replace;
const defaultValidator = canValidate.validator();
const originalOnce = defaultValidator.once;

// Set "attributes" field
if (!canModel.attributes) {
  canModel.attributes = {};
}

// Returns a function which will be halted unless `this.element` exists
// - useful for callbacks which depend on the controller's presence in the DOM
canControl.prototype._ifNotRemoved = function (fn) {
  let isPresent = this.element;
  return function () {
    return isPresent ? fn.apply(this, arguments) : null;
  };
};

// Insert current Control instance into element's data
canControl.setup = function () {
  let originalInit = this.prototype.init;
  let init = function (el) {
    let $el = $(el);
    if ($el.length) {
      if (!$el.data('controls') || !$el.data('controls').length) {
        $el.data('controls', [this]);
      } else {
        $el.data('controls').push(this);
      }
    }

    originalInit.apply(this, arguments);
  };
  this.prototype.init = init;
  originalControlSetup.apply(this, arguments);
};

canList.prototype.replace = function (items) {
  if (!items || !items.then || !loIsFunction(items.then)) {
    originListReplace.call(this, items);
    return;
  }

  items.then((data) => {
    originListReplace.call(this, data);
  });
};

// Override "once" method to avoid exception connect to "length" name
defaultValidator.once = function (value, options, name) {
  if (name === 'length') {
    return;
  }

  return originalOnce.apply(this, arguments);
};

canList.prototype.sort = function (predicate) {
  const array = loMap(this, (item) => item);
  this.replace(array.sort(predicate));
  return this;
};
