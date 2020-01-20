/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canList from 'can-list';
import canComponent from 'can-component';
import AdvancedSearchContainer from '../view-models/advanced-search-container-vm';
import * as AdvancedSearch from '../../plugins/utils/advanced-search-utils';
import template from './advanced-search-filter-group.stache';

/**
 * Filter Group view model.
 * Contains logic used in Filter Group component
 * @constructor
 */
let viewModel = AdvancedSearchContainer.extend({
  /**
   * Contains available attributes for specific model.
   * @type {canList}
   */
  availableAttributes: canList(),
  /**
   * Adds Filter Operator and Filter Attribute to the collection.
   */
  addFilterCriterion: function () {
    let items = this.attr('items');
    items.push(AdvancedSearch.create.operator('AND'));
    items.push(AdvancedSearch.create.attribute());
  },
});

/**
 * Filter Group is a component allowing to compose Filter Attributes and Operators.
 */
export default canComponent.extend({
  tag: 'advanced-search-filter-group',
  view: canStache(template),
  leakScope: true,
  viewModel: viewModel,
});
