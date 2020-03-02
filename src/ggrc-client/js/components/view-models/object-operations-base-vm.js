/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loResult from 'lodash/result';
import loIncludes from 'lodash/includes';
import loIsEmpty from 'lodash/isEmpty';
import loForEach from 'lodash/forEach';
import loFind from 'lodash/find';
import loIsEqual from 'lodash/isEqual';
import canBatch from 'can-event/batch/batch';
import canDefineMap from 'can-define/map/map';
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

const ObjectOperationsBaseVM = canDefineMap.extend({
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
  extractConfig(type, config) {
    const special = loResult(
      loFind(
        config.special,
        (special) => {
          return loIncludes(special.types, type);
        }),
      'config'
    );

    const resultConfig = !loIsEmpty(special) ? special : config.general;
    return resultConfig;
  },
}, {
  parentInstance: {
    get() {
      return getInstance(this.object, this.join_object_id);
    },
  },
  model: {
    get() {
      return businessModels[this.type];
    },
  },
  type: {
    value: 'Control', // We set default as Control
    /*
    * When object type is changed it should be needed to change a config.
    * For example, if not set a special config for type [TYPE] then is used
    * general config, otherwise special config.
    */
    set(mapType) {
      if (mapType === this.type) {
        return mapType;
      }
      this.setNewType(mapType);
      return mapType;
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
    value: () => ({
      general: {},
      special: [],
    }),
  },
  currConfig: {
    value: null,
  },
  showSearch: {
    value: true,
  },
  showResults: {
    value: true,
  },
  resultsRequested: {
    value: false,
  },
  availableTypes() {
    const object = this.object;
    const list = object !== 'Assessment'
      ? getMappingList(object)
      : GGRC.config.snapshotable_objects;

    return groupTypes(list);
  },
  object: {
    value: '',
  },
  is_loading: {
    value: false,
  },
  is_saving: {
    value: false,
  },
  join_object_id: {
    value: '',
  },
  selected: {
    value: () => [],
  },
  entries: {
    value: () => [],
  },
  entriesTotalCount: {
    value: '',
  },
  options: {
    value: () => [],
  },
  relevant: {
    value: () => [],
  },
  useSnapshots: {
    value: false,
  },
  'join-object-id': {
    value: '',
  },
  relevantTo: {
    value: null,
  },
  onSearchCallback: {
    value: () => $.noop(),
  },
  setNewType(mapType) {
    let config = this.config || {};
    let resultConfig = ObjectOperationsBaseVM.extractConfig(
      mapType,
      config.serialize()
    );

    // We remove type because update action can make recursion (when we set
    // type)
    delete resultConfig.type;

    this.update(resultConfig);
    this.currConfig = resultConfig;
    this.resultsRequested = false;
    this.entriesTotalCount = '';
  },
  onSubmit() {
    this.is_loading = true;
    this.entries.replace([]);
    this.resultsRequested = true;
    this.showResults = true;

    if (this.onSearchCallback) {
      this.onSearchCallback();
    }
  },
  onLoaded() {
    // set focus on the top modal window
    $('.modal:visible')
      .last()
      .focus();
  },
  /**
   * Updates view model fields to values from config.
   *
   * @param {Object} config - Plain object with values for updating
   */
  update(config) {
    canBatch.start();

    // do not update fields with the same values in VM and config
    loForEach(config, (value, key) => {
      let vmValue = this.get(key);
      let hasSerialize = Boolean(vmValue && vmValue.serialize);

      if (hasSerialize) {
        vmValue = vmValue.serialize();
      }

      if (!loIsEqual(vmValue, value)) {
        this.set(key, value);
      }
    });

    canBatch.stop();
  },
});

export default ObjectOperationsBaseVM;
