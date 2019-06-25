/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loIncludes from 'lodash/includes';
import loIsFunction from 'lodash/isFunction';
import loForEach from 'lodash/forEach';
import canConstruct from 'can-construct';

const Mixin = canConstruct.extend({
  newInstance: function () {
    throw new Error('Mixins cannot be directly instantiated');
  },
  add_to: function (cls) {
    if (this === Mixin) {
      throw new Error('Must only add a subclass of Mixin to an object,' +
        ' not Mixin itself');
    }
    function setupFns(obj) {
      return function (fn, key) {
        let blockedKeys = ['fullName', 'defaults', '_super', 'constructor'];
        let aspect = ~key.indexOf(':') ?
          key.substr(0, key.indexOf(':')) :
          'after';
        let oldfn;

        key = ~key.indexOf(':') ? key.substr(key.indexOf(':') + 1) : key;
        if (fn !== Mixin[key] && !blockedKeys.includes(key)) {
          oldfn = obj[key];
          // TODO support other ways of adding functions.
          //  E.g. "override" (doesn't call super fn at all)
          //       "sub" (sets this._super for mixin function)
          //       "chain" (pushes result of oldfn onto args)
          //       "before"/"after" (overridden function)
          // TODO support extension for objects.
          //   Necessary for "attributes"/"serialize"/"convert"
          // Defaults will always be "after" for functions
          //  and "override" for non-function values
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
      Object.keys(this).forEach(function (key) {
        setupFns(cls)(this[key], key);
      }.bind(this));
      loForEach(this.prototype, setupFns(cls.prototype));
    }
  },
}, {});

export default Mixin;
