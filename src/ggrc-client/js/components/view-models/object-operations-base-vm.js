/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loResult from 'lodash/result';
import loIsNull from 'lodash/isNull';
import loIncludes from 'lodash/includes';
import loIsEmpty from 'lodash/isEmpty';
import loForEach from 'lodash/forEach';
import loFind from 'lodash/find';
import loIsEqual from 'lodash/isEqual';
import canBatch from 'can-event/batch/batch';
import canMap from 'can-map';
import {
  getMappingList,
} from '../../models/mappers/mappings';
import {
  getInstance,
  groupTypes,
} from '../../plugins/utils/models-utils';
import * as businessModels from '../../models/business-models';

/**
 *  @typedef SpecialConfig
 *  @type {Object}
 *  @property {String[]} types - An array contains typenames for which is set a
 *                               special config.
 *  @property {Object} config - Has fields with special values for viewModel.
 */

/**
 *  @typedef SpecialConfig
 *  @type {Object}
 *  @property {String[]} types - An array contains typenames for which is set a
 *                               special config.
 *  @property {Object} config - Has fields with special values for viewModel.
 */

const ObjectOperationsBaseVM = canMap.extend({
  /**
   * Extract certain config for passed type from config.
   * If there is special config for type then return it else return
   * general config.
   *
   * @param {String} type - Type for search.
   * @param {SpecialConfig} config - Config with general and special config cases.
   * @param {Object} config.general - Default config.
   * @param {SpecialConfig[]} config.special - Has array of special configs.
   * @return {Object} - extracted config.
   */
  extractConfig: function (type, config) {
    let resultConfig;
    let special = loResult(
      loFind(
        config.special,
        function (special) {
          return loIncludes(special.types, type);
        }),
      'config'
    );

    resultConfig = !loIsEmpty(special) ? special : config.general;
    return resultConfig;
  },
}, {
  define: {
    parentInstance: {
      get: function () {
        return getInstance(this.attr('object'), this.attr('join_object_id'));
      },
    },
    model: {
      get: function () {
        return businessModels[this.attr('type')];
      },
    },
    type: {
    /*
     * When object type is changed it should be needed to change a config.
     * For example, if not set a special config for type [TYPE] then is used
     * general config, otherwise special config.
     */
      set: function (mapType) {
        let config = this.attr('config') || {};
        let type = this.attr('type');
        let configHandler;
        let resultConfig = ObjectOperationsBaseVM.extractConfig(
          mapType,
          config.serialize()
        );

        // We remove type because update action can make recursion (when we set
        // type)
        delete resultConfig.type;

        // if we set type first time then update config immediately
        if (!type) {
          configHandler = this.update.bind(this);
        } else {
          configHandler = this.prepareConfig.bind(this);
        }

        configHandler(resultConfig);
        if (loIsNull(this.attr('freezedConfigTillSubmit'))) {
          this.attr('freezedConfigTillSubmit', resultConfig);
        }

        this.attr('currConfig', resultConfig);

        return mapType;
      },
    },
  },
  /**
   * Config is an object with general and special settings.
   *
   * @namespace
   * @property {Object} general - Has fields with general values for viewModel.
   * @property {SpecialConfig[]} special - Has array of special configs.
   */
  config: {
    general: {},
    special: [],
  },
  /**
   * There is situation when user switch type from one two another.
   * After it current config is changed immediately. It leads to the fact
   * that all things in the templates are rerendered.
   * But several controls must not be rerenderd till submit action will not be
   * occurred (for example it's a results in unified mapper - when we switch
   * object type the results should not be painted in another color (if
   * unified mapper operates with a snapshots and usual objects)).
   */
  freezedConfigTillSubmit: null,
  currConfig: null,
  showSearch: true,
  showResults: true,
  type: 'Control', // We set default as Control
  availableTypes: function () {
    let list = getMappingList(this.attr('object'));
    return groupTypes(list);
  },
  object: '',
  is_loading: false,
  is_saving: false,
  assessmentTemplate: '',
  join_object_id: '',
  selected: [],
  entries: [],
  options: [],
  newEntries: [],
  relevant: [],
  useSnapshots: false,
  onSearchCallback: $.noop(),
  onSubmit: function () {
    if (this.onSearchCallback) {
      this.onSearchCallback();
    }
  },
  onLoaded(element) {
    // set focus on the top modal window
    $('.modal:visible')
      .last()
      .focus();
  },
  prepareConfig: function (config) {
    this.update(config);
  },
  /**
   * Updates view model fields to values from config.
   *
   * @param {Object} config - Plain object with values for updating
   */
  update: function (config) {
    canBatch.start();

    // do not update fields with the same values in VM and config
    loForEach(config, (value, key) => {
      let vmValue = this.attr(key);
      let hasSerialize = Boolean(vmValue && vmValue.serialize);

      if (hasSerialize) {
        vmValue = vmValue.serialize();
      }

      if (!loIsEqual(vmValue, value)) {
        this.attr(key, value);
      }
    });

    canBatch.stop();
  },
});

export default ObjectOperationsBaseVM;
