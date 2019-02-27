/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

(function (GGRC, can) {
  /*  GGRC.ListLoaders.MappingResult
   *
   *  - `instance`: The resulting item itself
   *  - `mappings`: Essentially, the reason(s) the instance appears in the
   *      list.  This may be an instance of can.Model or a pair containing
   *      (binding, result) in the case of a chained ListLoader.
   *
   *  For FilteredListLoader, the mappings are (`result`, `binding`), where
   *    `binding` is the binding in which the result appears, and thus,
   *    `binding.loader` contains information about the filter.
   *    `binding.instance`, then, is the instance on which the original,
   *    unfiltered list is specified.
   */
  GGRC.ListLoaders.MappingResult = can.Map.extend({}, {
    init: function (instance, mappings, binding) {
      if (!mappings) {
        // Assume item was passed in as an object
        mappings = instance.mappings;
        binding = instance.binding;
        instance = instance.instance;
      }

      this.instance = instance;
      this.mappings = this._make_mappings(mappings);
      this.binding = binding;
    },

    //  `_make_mappings`
    //  - Ensures that every instance in `mappings` is an instance of
    //    `MappingResult`.
    _make_mappings: function (mappings) {
      mappings = mappings || [];
      return mappings.map(function (mapping) {
        if (!(mapping instanceof GGRC.ListLoaders.MappingResult)) {
          mapping = new GGRC.ListLoaders.MappingResult(mapping);
        }
        return mapping;
      });
    },

    //  `observe_trigger`, `watch_observe_trigger`, `trigger_observe_trigger`
    //  - These exist solely to support dynamic updating of `*_compute`.
    //    Basically, these fake dependencies for those computes so each is
    //    updated any time a mapping is inserted or removed beyond a
    //    "virtual" level, which would otherwise obscure changes in the
    //    "first-level mappings" which both `bindings_compute` and
    //    `mappings_compute` depend on.
    observe_trigger: function () {
      if (!this._observe_trigger) {
        this._observe_trigger = new can.Map({change_count: 1});
      }
      return this._observe_trigger;
    },

    watch_observe_trigger: function () {
      this.observe_trigger().attr('change_count');
      this.mappings.forEach(function (mapping) {
        if (mapping.watch_observe_trigger) {
          mapping.watch_observe_trigger();
        }
      });
    },

    trigger_observe_trigger: function () {
      let observeTrigger = this.observe_trigger();
      observeTrigger.attr('change_count', observeTrigger.change_count + 1);
    },

    //  `insert_mapping` and `remove_mapping`
    //  - These exist solely to trigger an `observe_trigger` change event
    insert_mapping: function (mapping) {
      this.mappings.push(mapping);
      // Trigger change event
      this.trigger_observe_trigger();
    },

    remove_mapping: function (mapping) {
      let ret;
      let mappingIndex = this.mappings.indexOf(mapping);
      if (mappingIndex > -1) {
        ret = this.mappings.splice(mappingIndex, 1);
        //  Trigger change event
        this.trigger_observe_trigger();
        return ret;
      }
    },

    //  `get_bindings`, `bindings_compute`, `get_bindings_compute`
    //  - Returns a list of the `ListBinding` instances which are the source
    //    of 'first-level mappings'.
    get_bindings: function () {
      let bindings = [];

      this.walk_instances(function (instance, result, depth) {
        if (depth === 1) {
          bindings.push(result.binding);
        }
      });
      return bindings;
    },

    bindings_compute: function () {
      if (!this._bindings_compute) {
        this._bindings_compute = this.get_bindings_compute();
      }
      return this._bindings_compute;
    },

    get_bindings_compute: function () {
      let self = this;

      return can.compute(function () {
        // Unnecessarily access observe_trigger to be able to trigger change
        self.watch_observe_trigger();
        return self.get_bindings();
      });
    },

    get_mappings: function () {
      let self = this;
      let mappings = [];

      this.walk_instances(function (instance, result, depth) {
        if (depth === 1) {
          if (instance === true) {
            mappings.push(self.instance);
          } else {
            mappings.push(instance);
          }
        }
      });
      return mappings;
    },

    mappings_compute: function () {
      if (!this._mappings_compute) {
        this._mappings_compute = this.get_mappings_compute();
      }
      return this._mappings_compute;
    },

    get_mappings_compute: function () {
      let self = this;

      return can.compute(function () {
        // Unnecessarily access _observe_trigger to be able to trigger change
        self.watch_observe_trigger();
        return self.get_mappings();
      });
    },

    walk_instances: function (fn, lastInstance, depth) {
      let i;
      if (!depth) {
        depth = 0;
      }
      if (this.instance !== lastInstance) {
        fn(this.instance, this, depth);
        depth++;
      }
      for (i = 0; i < this.mappings.length; i++) {
        this.mappings[i].walk_instances(fn, this.instance, depth);
      }
    },
  });
})(window.GGRC, window.can);
