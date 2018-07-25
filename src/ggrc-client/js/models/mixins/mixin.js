/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

export default can.Construct.extend('can.Model.Mixin', {
  extend: function (fullName, klass, proto) {
    let tempname;
    let mixinName;
    let parts;
    let shortName;
    let Constructor;

    if (typeof fullName === 'string') {
      // Mixins do not go into the global namespace.
      tempname = fullName;
      fullName = '';
    }
    Constructor = this._super(fullName, klass, proto);

    // instead mixins sit under CMS.Models.Mixins
    if (tempname) {
      parts = tempname.split('.');
      shortName = parts.pop();
      Constructor.fullName = tempname;
    }

    mixinName = 'CMS.Models.Mixins' + (parts.length ?
      '.' + parts.join('.') :
      '');
    can.getObject(mixinName, window, true)[shortName] = Constructor;
    return Constructor;
  },
  newInstance: function () {
    throw new Error('Mixins cannot be directly instantiated');
  },
  add_to: function (cls) {
    if (this === can.Model.Mixin) {
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
        if (fn !== can.Model.Mixin[key] && !~can.inArray(key, blockedKeys)) {
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
          if (can.isFunction(oldfn)) {
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
            obj[key] = can.extend(obj[key], fn);
          } else {
            obj[key] = fn;
          }
        }
      };
    }

    if (!~can.inArray(this.fullName, cls._mixins)) {
      cls._mixins = cls._mixins || [];
      cls._mixins.push(this.fullName);
      Object.keys(this).forEach(function (key) {
        setupFns(cls)(this[key], key);
      }.bind(this));
      can.each(this.prototype, setupFns(cls.prototype));
    }
  },
}, {});
