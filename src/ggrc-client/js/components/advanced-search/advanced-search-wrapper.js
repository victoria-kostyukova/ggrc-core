/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canMap from 'can-map';
import canComponent from 'can-component';
import * as StateUtils from '../../plugins/utils/state-utils';
import {getAvailableAttributes} from '../../plugins/utils/tree-view-utils';
import * as AdvancedSearch from '../../plugins/utils/advanced-search-utils';
import pubSub from '../../pub-sub';

export default canComponent.extend({
  tag: 'advanced-search-wrapper',
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      hasStatusFilter: {
        get: function () {
          return StateUtils.hasFilter(this.attr('modelName'));
        },
      },
    },
    modelName: null,
    modelDisplayName: null,
    filterItems: [AdvancedSearch.create.attribute()],
    mappingItems: [],
    statusItem: AdvancedSearch.create.state(),
    relevantTo: [],
    pubSub,
    selectSavedSearchFilter(savedSearch) {
      this.attr('filterItems', savedSearch.filterItems || []);
      this.attr('mappingItems', savedSearch.mappingItems || []);
      this.attr('statusItem', savedSearch.statusItem);

      if (savedSearch.modelName && savedSearch.modelDisplayName) {
        this.attr('modelName', savedSearch.modelName);
        this.attr('modelDisplayName', savedSearch.modelDisplayName);
      }
    },
    availableAttributes: function () {
      return getAvailableAttributes(this.attr('modelName'));
    },
    addFilterAttribute: function () {
      let items = this.attr('filterItems');
      if (items.length) {
        items.push(AdvancedSearch.create.operator('AND'));
      }
      items.push(AdvancedSearch.create.attribute());
    },
    addMappingFilter: function () {
      let items = this.attr('mappingItems');
      if (items.length) {
        items.push(AdvancedSearch.create.operator('AND'));
      }
      items.push(AdvancedSearch.create.mappingCriteria());
    },
    resetFilters: function () {
      this.attr('filterItems', [AdvancedSearch.create.attribute()]);
      this.attr('mappingItems', []);
      this.setDefaultStatusItem();
    },
    setDefaultStatusItem: function () {
      if (this.attr('hasStatusFilter')) {
        const defaultStatusItem = AdvancedSearch.setDefaultStatusConfig(
          this.attr('modelName')
        );
        this.attr('statusItem.value').attr(defaultStatusItem);
      } else {
        this.attr('statusItem', AdvancedSearch.create.state());
      }
    },
    modelNameChanged(ev) {
      this.attr('modelName', ev.modelName);
      this.resetFilters();
    },
  }),
  init: function () {
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
