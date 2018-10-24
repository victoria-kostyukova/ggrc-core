/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {getMappableTypes} from '../../plugins/ggrc_utils';
import {getModelByType} from '../../plugins/utils/models-utils';
import * as businessModels from '../business-models';

/*
  class Mappings
  represents everything known about how GGRC objects connect to each other.

  a Mappings instance contains the set of known mappings for a module, such as "ggrc_core"
  or "ggrc_gdrive_integration".  The set of all Mappings instances is used throughout the
  system to build widgets, map and unmap objects, etc.

  To configure a new Mappings instance, use the following format :
  { <mixin name or source object type> : {
      _mixins : [ <mixin name>, ... ],
      _canonical : { <option type> : <name of mapping in parent object>, ... }
      <mapping name> : Proxy(...) | Direct(...)
                      | Multi(...)
                      | CustomFilter(...),
      ...
    }
  }
*/
export default can.Construct.extend({
  modules: {},
  getTypeGroups: function () {
    return {
      entities: {
        name: 'People/Groups',
        items: [],
      },
      business: {
        name: 'Scope',
        items: [],
      },
      governance: {
        name: 'Governance',
        items: [],
      },
    };
  },

  /**
   * Return list of allowed for mapping models.
   * Performs checks for
   * @param {String} type - base model type
   * @param {Array} include - array of included models
   * @param {Array} exclude - array of excluded models
   * @return {Array} - list of allowed for mapping Models
   */
  getMappingList: function (type, include, exclude) {
    let baseModel = getModelByType(type);
    exclude = exclude || [];
    include = include || [];
    if (!baseModel) {
      return [];
    }

    if (can.isFunction(baseModel.getAllowedMappings)) {
      return baseModel
        .getAllowedMappings()
        .filter(function (model) {
          return exclude.indexOf(model) < 0;
        })
        .concat(include);
    }
    return getMappableTypes(type, {
      whitelist: include,
      forbidden: exclude,
    });
  },
  /**
   * Return list of allowed for mapping types.
   * Performs checks for
   * @param {String} type - base model type
   * @param {Array} include - array of included models
   * @param {Array} exclude - array of excluded models
   * @return {Array} - list of allowed for mapping Models
   */
  getMappingTypes: function (type, include, exclude) {
    let list = this.getMappingList(type, include, exclude);
    return this.groupTypes(list);
  },
  /**
   * Return allowed for mapping type in appropriate group.
   * @param {String} type - base model type
   * @return {Array} - object with one allowed for mapping Model
   */
  getMappingType: function (type) {
    return this.groupTypes([type]);
  },
  /**
   * Returns the list of allowed direct mapping models
   * with possible related mapping models
   * @param {String} type - base model type
   * @return {Array} - list of available mappings
   */
  getAvailableMappings(type) {
    let canonical = this.get_canonical_mappings_for(type);
    let related = this.get_related_mappings_for(type);

    return Object.assign({}, canonical, related);
  },
  /**
   * Return grouped types.
   * @param {Array} types - array of base model types
   * @return {Array} - object with one allowed for mapping Model
   */
  groupTypes(types) {
    let groups = this.getTypeGroups();

    types.forEach((modelName) => {
      return this._addFormattedType(modelName, groups);
    });
    return groups;
  },
  /**
   * Returns cmsModel fields in required format.
   * @param {can.Model} cmsModel - cms model
   * @return {object} - cms model in required format
   */
  _prepareCorrectTypeFormat: function (cmsModel) {
    return {
      category: cmsModel.category,
      name: cmsModel.title_plural,
      value: cmsModel.model_singular,
      singular: cmsModel.model_singular,
      plural: cmsModel.title_plural.toLowerCase().replace(/\s+/, '_'),
      table_plural: cmsModel.table_plural,
      title_singular: cmsModel.title_singular,
    };
  },
  /**
   * Adds model to correct group.
   * @param {string} modelName - model name
   * @param {object} groups - type groups
   */
  _addFormattedType: function (modelName, groups) {
    let group;
    let type;
    let cmsModel;
    cmsModel = getModelByType(modelName);
    if (!cmsModel || !cmsModel.title_singular) {
      return;
    }
    type = this._prepareCorrectTypeFormat(cmsModel);
    group = !groups[type.category] ?
      groups.governance :
      groups[type.category];

    group.items.push(type);
  },
  /*
    return all mappings from all modules for an object type.
    object - a string representing the object type's shortName

    return: a keyed object of all mappings (instances of GGRC.ListLoaders.BaseListLoader) by mapping name
    Example: Mappings.get_mappings_for('Program')
  */
  get_mappings_for: function (object) {
    let mappings = {};
    can.each(this.modules, function (mod, name) {
      if (mod[object]) {
        can.each(mod[object], function (mapping, mappingName) {
          if (mappingName === '_canonical') {
            return;
          }
          mappings[mappingName] = mapping;
        });
      }
    });
    return mappings;
  },
  /*
    return the canonical mapping (suitable for joining) between two objects.
    object - the string type (shortName) of the "from" object's class
    option - the string type (shortName) of the "to" object's class

    return: an instance of GGRC.ListLoaders.BaseListLoader (mappings are implemented as ListLoaders)
  */
  get_canonical_mapping: function (object, option) {
    let mapping = null;
    can.each(this.modules, (mod, name) => {
      if (mod._canonical_mappings && mod._canonical_mappings[object] &&
        mod._canonical_mappings[object][option]) {
        mapping = this.get_mapper(
          mod._canonical_mappings[object][option],
          object);
        return false;
      }
    });
    return mapping;
  },
  /*
    return the defined name of the canonical mapping between two objects.
    object - the string type (shortName) of the "from" object's class
    option - the string type (shortName) of the "to" object's class

    return: an instance of GGRC.ListLoaders.BaseListLoader (mappings are implemented as ListLoaders)
  */
  get_canonical_mapping_name: function (object, option) {
    let mappingName = null;
    can.each(this.modules, function (mod, name) {
      if (mod._canonical_mappings && mod._canonical_mappings[object] &&
        mod._canonical_mappings[object][option]) {
        mappingName = mod._canonical_mappings[object][option];
        return false;
      }
    });
    return mappingName;
  },
  /*
    return all canonical mappings (suitable for joining) from all modules for an object type.
    object - a string representing the object type's shortName

    return: a keyed object of all mappings (instances of CMS.Models)
  */
  get_canonical_mappings_for: function (object) {
    let mappings = {};
    can.each(this.modules, (mod, name) => {
      if (mod._canonical_mappings && mod._canonical_mappings[object]) {
        can.each(mod._canonical_mappings[object],
          (mappingName, model) => {
            mappings[model] = businessModels[model];
          });
      }
    });
    return mappings;
  },
  get_mapper: function (mappingName, type) {
    let mapper;
    let mappers = this.get_mappings_for(type);
    if (mappers) {
      mapper = mappers[mappingName];
      return mapper;
    }
  },
  _get_binding_attr: function (mapper) {
    if (typeof (mapper) === 'string') {
      return '_' + mapper + '_binding';
    }
  },
  // checks if binding exists without throwing debug statements
  // modeled after what get_binding is doing
  has_binding: function (mapper, model) {
    let binding;
    let mapping;
    let bindingAttr = this._get_binding_attr(mapper);

    if (bindingAttr) {
      binding = model[bindingAttr];
    }

    if (!binding) {
      if (typeof (mapper) === 'string') {
        mapping = this.get_mapper(mapper, model.constructor.shortName);
        if (!mapping) {
          return false;
        }
      } else if (!(mapper instanceof GGRC.ListLoaders.BaseListLoader)) {
        return false;
      }
    }

    return true;
  },
  get_binding: function (mapper, model) {
    let mapping;
    let binding;
    let bindingAttr = this._get_binding_attr(mapper);

    if (bindingAttr) {
      binding = model[bindingAttr];
    }

    if (!binding) {
      if (typeof (mapper) === 'string') {
      // Lookup and attach named mapper
        mapping = this.get_mapper(mapper, model.constructor.shortName);
        if (!mapping) {
          console.warn(
            `No such mapper: ${model.constructor.shortName}.${mapper}`);
        } else {
          binding = mapping.attach(model);
        }
      } else if (mapper instanceof GGRC.ListLoaders.BaseListLoader) {
      // Loader directly provided, so just attach
        binding = mapper.attach(model);
      } else {
        console.warn(`Invalid mapper specified: ${mapper}`);
      }
      if (binding && bindingAttr) {
        model[bindingAttr] = binding;
        binding.name = model.constructor.shortName + '.' + mapper;
      }
    }
    return binding;
  },
  get_list_loader: function (name, model) {
    let binding = this.get_binding(name, model);
    return binding.refresh_list();
  },
  get_mapping: function (name, model) {
    let binding = this.get_binding(name, model);
    if (binding) {
      binding.refresh_list();
      return binding.list;
    }
    return [];
  },
  /*
    return all related mappings from all modules for an object type.
    object - a string representing the object type's shortName

    return: a keyed object of all related mappings (instances of CMS.Models)
  */
  get_related_mappings_for(object) {
    let mappings = {};
    can.each(this.modules, (mod) => {
      if (mod._related_mappings && mod._related_mappings[object]) {
        can.each(mod._related_mappings[object],
          (mappingName, model) => {
            mappings[model] = businessModels[model];
          });
      }
    });
    return mappings;
  },
}, {
  /*
    On init:
    kick off the application of mixins to the mappings and resolve canonical mappings
  */
  init: function (name, opts) {
    let createdMappings;
    let that = this;
    this.constructor.modules[name] = this;
    this._canonical_mappings = {};
    this._related_mappings = {};
    if (this.groups) {
      can.each(this.groups, function (group, name) {
        if (typeof group === 'function') {
          that.groups[name] = $.proxy(group, that.groups);
        }
      });
    }
    createdMappings = this.create_mappings(opts);
    can.each(createdMappings, function (mappings, objectType) {
      if (mappings._canonical) {
        that._fillInMappings(objectType,
          mappings._canonical, that._canonical_mappings);
      }

      if (mappings._related) {
        that._fillInMappings(objectType,
          mappings._related, that._related_mappings);
      }
    });
    $.extend(this, createdMappings);
  },
  _fillInMappings(objectType, config, mappings) {
    if (!mappings[objectType]) {
      mappings[objectType] = {};
    }

    can.each(config || [],
      (optionTypes, mappingName) => {
        if (!can.isArray(optionTypes)) {
          optionTypes = [optionTypes];
        }
        can.each(optionTypes, (optionType) => {
          mappings[objectType][optionType] = mappingName;
        });
      });
  },
  // Recursively handle mixins -- this function should not be called directly.
  reify_mixins: function (definition, definitions) {
    let that = this;
    let finalDefinition = {};
    if (definition._mixins) {
      can.each(definition._mixins, function (mixin) {
        if (typeof (mixin) === 'string') {
          // If string, recursive lookup
          if (!definitions[mixin]) {
            console.warn('Undefined mixin: ' + mixin, definitions);
          } else {
            can.extend(true, finalDefinition,
              that.reify_mixins(definitions[mixin], definitions));
          }
        } else if (can.isFunction(mixin)) {
          // If function, call with current definition state
          mixin(finalDefinition);
        } else {
          // Otherwise, assume object and extend
          if (finalDefinition._canonical && mixin._canonical) {
            mixin = can.extend({}, mixin);

            can.each(mixin._canonical, function (types, mapping) {
              if (finalDefinition._canonical[mapping]) {
                if (!can.isArray(finalDefinition._canonical[mapping])) {
                  finalDefinition._canonical[mapping] =
                    [finalDefinition._canonical[mapping]];
                }
                finalDefinition._canonical[mapping] =
                  can.unique(finalDefinition._canonical[mapping]
                    .concat(types));
              } else {
                finalDefinition._canonical[mapping] = types;
              }
            });
            finalDefinition._canonical = can.extend({}, mixin._canonical,
              finalDefinition._canonical);
            delete mixin._canonical;
          }
          can.extend(finalDefinition, mixin);
        }
      });
    }
    can.extend(true, finalDefinition, definition);
    delete finalDefinition._mixins;
    return finalDefinition;
  },

  // create mappings for definitions -- this function should not be called directly/
  create_mappings: function (definitions) {
    let mappings = {};

    can.each(definitions, function (definition, name) {
      // Only output the mappings if it's a model, e.g., uppercase first letter
      if (name[0] === name[0].toUpperCase()) {
        mappings[name] = this.reify_mixins(definition, definitions);
      }
    }, this);
    return mappings;
  },
});
