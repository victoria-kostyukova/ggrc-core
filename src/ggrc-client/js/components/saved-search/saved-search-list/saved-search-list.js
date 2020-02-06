/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canComponent from 'can-component';
import canStache from 'can-stache';
import canMap from 'can-map';
import canDefineMap from 'can-define/map/map';
import template from './saved-search-list.stache';
import {
  buildSearchPermalink,
  parseFilterJson,
} from '../../../plugins/utils/advanced-search-utils';
import isFunction from 'can-util/js/is-function/is-function';
import '../../clipboard-link/clipboard-link';
import Pagination from '../../base-objects/pagination';
import SavedSearch from '../../../models/service-models/saved-search';
import * as BusinessModels from '../../../models/business-models';
import pubSub from '../../../pub-sub';

const ViewModel = canDefineMap.extend({
  pubSub: {
    value: () => pubSub,
  },
  widgetId: {
    value: '',
  },
  objectType: {
    value: '',
  },
  searchType: {
    value: '',
  },
  searches: {
    value: () => [],
  },
  disabled: {
    value: false,
  },
  selectedSearchId: {
    value: null,
  },
  advancedSearch: {
    value: null,
  },
  isLoading: {
    value: false,
  },
  isGlobalSearch: {
    get() {
      return this.searchType === 'GlobalSearch';
    },
  },
  isPagingShown: {
    get() {
      const total = this.searchesPaging.attr('total');
      const pageSize = this.searchesPaging.attr('pageSize');

      return total > pageSize;
    },
  },
  searchesPaging: {
    Type: canMap,
    value: () => {
      return new Pagination({
        pageSize: 10, pageSizeSelect: [10],
      });
    },
  },
  selectSearch(search) {
    const filter = parseFilterJson(search.filters);
    const model = BusinessModels[search.object_type];
    const selectedSavedSearch = {
      ...filter,
      id: search.id,
    };

    if (model) {
      selectedSavedSearch.modelName = model.model_singular;
      selectedSavedSearch.modelDisplayName = model.title_plural;
    }

    // Can be set from parent component.
    // For example: tree-widget-container
    this.selectedSearchId = search.id;

    pubSub.dispatch({
      type: 'savedSearchSelected',
      savedSearch: selectedSavedSearch,
      searchType: this.searchType,
    });
  },
  loadSavedSearches() {
    // do NOT set type for global search
    const type = this.isGlobalSearch ?
      null :
      this.objectType;

    const searchType = this.searchType;
    this.isLoading = true;

    return SavedSearch.findBy(searchType, this.searchesPaging, type)
      .then(({total, values}) => {
        this.searchesPaging.attr('total', total);

        const searches = values.map((value) => new SavedSearch(value));
        this.searches = searches;
      }).always(() => {
        this.isLoading = false;
      });
  },
  removeSearch(search, event) {
    event.stopPropagation();

    return search.destroy().done(() => {
      const paging = this.searchesPaging;

      const needToGoToPrevPage = (
        paging.attr('current') > 1 &&
        this.searches.length === 1
      );

      if (needToGoToPrevPage) {
        // move to prev page when current page contains only one item (it was removed)
        // "loadSavedSearches" will be
        // triggered by "'{viewModel.searchesPaging} current'" handler
        paging.attr('current', paging.attr('current') - 1);
      } else {
        this.loadSavedSearches();
      }
    });
  },
  isSelectedSearch(search) {
    return search.id === this.selectedSearchId;
  },
  copyLink(permalink, el, event) {
    // prevent select
    event.stopPropagation();
  },
});

export default canComponent.extend({
  tag: 'saved-search-list',
  view: canStache(template),
  ViewModel,
  events: {
    '{viewModel.searchesPaging} current'() {
      this.viewModel.loadSavedSearches();
    },
    inserted() {
      this.viewModel.loadSavedSearches();
    },
    '{pubSub} savedSearchCreated'(pubSub, ev) {
      this.viewModel.loadSavedSearches().then(() => {
        this.viewModel.selectSearch(ev.search);
      });
    },
    '{pubSub} resetSelectedSavedSearch'() {
      this.viewModel.selectedSearchId = null;
    },
  },
  helpers: {
    permalinkBuilder(savedSearch, options) {
      if (isFunction(savedSearch)) {
        savedSearch = savedSearch();
      }

      const link = buildSearchPermalink(savedSearch.id, this.widgetId);
      return options.fn({permalink: link});
    },
  },
});
