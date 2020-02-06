/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canMap from 'can-map';
import canList from 'can-list';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import * as StateUtils from '../../plugins/utils/state-utils';
import {getAvailableAttributes} from '../../plugins/utils/tree-view-utils';
import * as AdvancedSearch from '../../plugins/utils/advanced-search-utils';
import pubSub from '../../pub-sub';

const ViewModel = canDefineMap.extend({
  hasStatusFilter: {
    get() {
      return StateUtils.hasFilter(this.modelName);
    },
  },
  modelName: {
    value: null,
  },
  modelDisplayName: {
    value: null,
  },
  filterItems: {
    Type: canList,
    value: () => [AdvancedSearch.create.attribute()],
  },
  mappingItems: {
    Type: canList,
    value: () => [],
  },
  statusItem: {
    Type: canMap,
    value: () => AdvancedSearch.create.state(),
  },
  relevantTo: {
    value: () => [],
  },
  pubSub: {
    value: () => pubSub,
  },
  selectSavedSearchFilter(savedSearch) {
    this.filterItems = savedSearch.filterItems || [];
    this.mappingItems = savedSearch.mappingItems || [];
    this.statusItem = savedSearch.statusItem;

    if (savedSearch.modelName && savedSearch.modelDisplayName) {
      this.modelName = savedSearch.modelName;
      this.modelDisplayName = savedSearch.modelDisplayName;
    }
  },
  availableAttributes() {
    return getAvailableAttributes(this.modelName);
  },
  addFilterAttribute() {
    let items = this.filterItems;
    if (items.length) {
      items.push(AdvancedSearch.create.operator('AND'));
    }
    items.push(AdvancedSearch.create.attribute());
  },
  addMappingFilter() {
    let items = this.mappingItems;
    if (items.length) {
      items.push(AdvancedSearch.create.operator('AND'));
    }
    items.push(AdvancedSearch.create.mappingCriteria());
  },
  resetFilters() {
    this.filterItems = [AdvancedSearch.create.attribute()];
    this.mappingItems = [];
    this.setDefaultStatusItem();
  },
  setDefaultStatusItem() {
    if (this.hasStatusFilter) {
      const defaultStatusItem = AdvancedSearch.setDefaultStatusConfig(
        this.modelName
      );
      this.statusItem.attr('value').attr(defaultStatusItem);
    } else {
      this.statusItem = AdvancedSearch.create.state();
    }
  },
  modelNameChanged(ev) {
    this.modelName = ev.modelName;
    this.resetFilters();
  },
});

export default canComponent.extend({
  tag: 'advanced-search-wrapper',
  leakScope: true,
  ViewModel,
  init() {
    this.viewModel.setDefaultStatusItem();
  },
  events: {
    '{viewModel.filterItems} change'() {
      pubSub.dispatch('resetSelectedSavedSearch');
    },
    '{viewModel.mappingItems} change'() {
      pubSub.dispatch('resetSelectedSavedSearch');
    },
    '{viewModel.statusItem} change'() {
      pubSub.dispatch('resetSelectedSavedSearch');
    },
    '{pubSub} savedSearchSelected'(pubSub, ev) {
      if (ev.searchType !== 'GlobalSearch') {
        return;
      }

      this.viewModel.selectSavedSearchFilter(ev.savedSearch);
    },
  },
});
