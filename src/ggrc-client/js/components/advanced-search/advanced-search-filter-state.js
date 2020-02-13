/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loMap from 'lodash/map';
import canStache from 'can-stache';
import canMap from 'can-map';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import '../dropdown/multiselect-dropdown';
import * as StateUtils from '../../plugins/utils/state-utils';
import template from './advanced-search-filter-state.stache';
import {isScopeModel} from '../../plugins/utils/models-utils';

/**
 * Filter State view model.
 * Contains logic used in Filter State component
 * @constructor
 */
const ViewModel = canDefineMap.extend({
  label: {
    get() {
      return isScopeModel(this.modelName) ? 'Launch Status' : 'State';
    },
  },
  /**
   * Contains available states for specific model.
   * @type {string}
   * @example
   * Active
   * Draft
   */
  filterStates: {
    get() {
      let items = this.stateModel.attr('items') || [];

      let allStates = StateUtils.getStatesForModel(
        this.modelName,
        this.statesCollectionKey
      );

      let filterStates = allStates.map((filterState) => {
        return {
          value: filterState,
          checked: (items.indexOf(filterState) > -1),
        };
      });

      return filterStates;
    },
  },
  /**
   * Indicates whether status tooltip should be displayed
   * @type {boolean}
   */
  statusTooltipVisible: {
    get() {
      return StateUtils.hasFilterTooltip(this.modelName);
    },
  },
  /**
   * Indicates whether operator should be displayed.
   * @type {boolean}
   */
  showOperator: {
    type: 'boolean',
    value: true,
  },
  /**
   * Contains criterion's fields: operator, modelName, items.
   * Initializes filterStates.
   * @type {canMap}
  */
  stateModel: {
    Type: canMap,
    Value: canMap,
  },
  /**
   * Contains specific model name.
   * @type {string}
   * @example
   * Requirement
   * Regulation
   */
  modelName: {
    value: null,
  },
  /**
   * Contains key of collection which will be used to get list of available
   * statuses for certain model.
   * @type {Symbol|null}
   */
  statesCollectionKey: {
    value: null,
  },
  /**
   * Saves selected states.
   * @param {Array} selectedStates - selected states.
   */
  saveTreeStates(selectedStates) {
    let states;

    // in this case we save previous states
    if (!selectedStates) {
      return;
    }

    states = loMap(selectedStates, 'value');

    this.stateModel.attr('items', states);
  },
  /**
   * handler is passed to child component, which is dispatched when items changed
   * @param {Object} event - event which contains array of selected items.
   */
  statesChanged(event) {
    this.saveTreeStates(event.selected);
  },
});

/**
 * Filter State is a specific kind of Advanced Search Filter items.
 */
export default canComponent.extend({
  tag: 'advanced-search-filter-state',
  view: canStache(template),
  leakScope: true,
  ViewModel,
});
