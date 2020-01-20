/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loIncludes from 'lodash/includes';
import loIsFunction from 'lodash/isFunction';

export default class Mixin {
  constructor() {
    throw new Error('Mixins cannot be directly instantiated');
  }

  static addTo(cls) {
    if (this === Mixin) {
      throw new Error('Must only add a subclass of Mixin to an object,' +
        ' not Mixin itself');
    }
    function setupFns(obj) {
      return function (fn, key) {
        let blockedKeys = ['constructor', 'length', 'name', 'prototype'];
        let aspect;
        let index = key.indexOf(':');
        if (index !== -1) {
          aspect = key.substr(0, index);
          key = key.substr(index + 1);
        } else {
          aspect = 'after';
        }

        if (!blockedKeys.includes(key)) {
          let oldfn = obj[key];
          if (loIsFunction(oldfn)) {
            switch (aspect) {
              case 'before':
                obj[key] = function () {
                  fn.apply(this, arguments);
                  return oldfn.apply(this, arguments);
                };
                break;
              case 'after':
                obj[key] = function () {
                  let result;
                  result = oldfn.apply(this, arguments);
                  fn.apply(this, arguments);
                  return result;
                };
                break;
              default:
                break;
            }
          } else if (aspect === 'extend') {
            obj[key] = Object.assign(obj[key], fn);
          } else {
            obj[key] = fn;
          }
        }
      };
    }

    if (!loIncludes(cls._mixins, this)) {
      cls._mixins = cls._mixins || [];
      cls._mixins.push(this);
      // static properties
      Object.getOwnPropertyNames(this).forEach((key) => {
        setupFns(cls)(this[key], key);
      });
      // prototype properties
      Object.getOwnPropertyNames(this.prototype).forEach((key) => {
        setupFns(cls.prototype)(this.prototype[key], key);
      });
    }
  }
}
