/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canComponent from 'can-component';
import AdvancedSearchContainer from '../view-models/advanced-search-container-vm';
import * as AdvancedSearch from '../../plugins/utils/advanced-search-utils';
import template from './advanced-search-mapping-group.stache';

/**
 * Mapping Group view model.
 * Contains logic used in Mapping Group component.
 * @constructor
 */
const ViewModel = AdvancedSearchContainer.extend({
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
   * Indicates that Group is created on the root level.
   * @type {boolean}
   */
  root: {
    value: false,
  },
  /**
   * Adds Filter Operator and Mapping Criteria to the collection.
   */
  addMappingCriteria() {
    let items = this.items;
    items.push(AdvancedSearch.create.operator('AND'));
    items.push(AdvancedSearch.create.mappingCriteria());
  },
});

/**
 * Mapping Group is a component allowing to compose Mapping Criteria and Operators.
 */
export default canComponent.extend({
  tag: 'advanced-search-mapping-group',
  view: canStache(template),
  leakScope: true,
  ViewModel,
});
