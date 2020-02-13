/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canList from 'can-list';
import canMap from 'can-map';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import makeArray from 'can-util/js/make-array/make-array';
import template from './templates/tree-view-filter.stache';
import {hasFilter} from '../../plugins/utils/state-utils';
import QueryParser from '../../generated/ggrc-filter-query-parser';
import * as AdvancedSearch from '../../plugins/utils/advanced-search-utils';
import SavedSearch from '../../models/service-models/saved-search';
import {notifier} from '../../plugins/utils/notifiers-utils';
import router from '../../router';
import pubSub from '../../pub-sub';
import {
  isObjectContextPage,
  isAllObjects,
  isMyWork,
} from '../../plugins/utils/current-page-utils';
import {concatFilters} from '../../plugins/utils/query-api-utils';

import '../tree/tree-filter-input';
import '../tree/tree-status-filter';
import '../advanced-search/advanced-search-mapping-container';
import '../advanced-search/advanced-search-filter-container';
import '../dropdown/multiselect-dropdown';
import '../saved-search/saved-search-list/saved-search-list';
import '../saved-search/create-saved-search/create-saved-search';
import '../simple-modal/simple-modal';
import {handleAjaxError} from '../../plugins/utils/errors-utils';

const EXPECTED_FILTERS_COUNT = 2;

const ViewModel = canDefineMap.extend({
  modelName: {
    get() {
      return this.model.model_singular;
    },
  },
  statusFilterVisible: {
    get() {
      return hasFilter(this.modelName);
    },
  },
  isSavedSearchShown: {
    get() {
      if (isMyWork()) {
        // do NOT show Advanced saved search list on Dashboard page
        return false;
      }

      if (isAllObjects() &&
        this.model.model_plural === 'CycleTaskGroupObjectTasks') {
        // do NOT show Advanced saved search list on AllObjects page (Tasks tab)
        return false;
      }

      return true;
    },
  },
  selectedSavedSearchId: {
    get() {
      if (this.filterIsDirty) {
        return;
      }

      return (
        this.advancedSearch.attr('selectedSavedSearch.id')
      ) || (
        this.appliedSavedSearch &&
        this.appliedSavedSearch.id
      );
    },
  },
  showEmailImport: {
    get() {
      const appliedSavedSearchId = (
        this.advancedSearch.attr('selectedSavedSearch.id')
      ) || (
        this.appliedSavedSearch &&
        this.appliedSavedSearch.id
      );

      return !!appliedSavedSearchId
        && this.emailImportSearchId === appliedSavedSearchId;
    },
  },
  emailImportSearchId: {
    value: null,
  },
  filtersReady: {
    value: () => {
      return new Set();
    },
  },
  pubSub: {
    value: () => pubSub,
  },
  router: {
    value: () => router,
  },
  model: {
    value: null,
  },
  filters: {
    value: () => [],
  },
  appliedSavedSearch: {
    value: () => ({}),
  },
  filterIsDirty: {
    value: false,
  },
  columns: {
    value: null,
  },
  widgetId: {
    value: null,
  },
  additionalFilter: {
    value: null,
  },
  currentFilter: {
    value: () => ({}),
  },
  shouldWaitForFilters: {
    value: true,
  },
  parentInstance: {
    value: null,
  },
  savedSearchPermalink: {
    value: '',
  },
  loading: {
    value: false,
  },
  advancedSearch: {
    Type: canMap,
    value: () => ({
      open: false,
      filter: null,
      request: canList(),
      filterItems: canList(),
      appliedFilterItems: canList(),
      mappingItems: canList(),
      appliedMappingItems: canList(),
      parentItems: canList(),
      appliedParentItems: canList(),
      parentInstance: null,
      selectedSavedSearch: canMap(),
    }),
  },
  triggerSearchPermalink(isDisplay) {
    pubSub.dispatch({
      type: 'triggerSearchPermalink',
      widgetId: this.widgetId,
      searchPermalinkEnabled: isDisplay,
    });
  },
  searchQueryChanged({name, query}) {
    const filter = makeArray(this.filters)
      .find((item) => item.name === name);
    if (filter) {
      filter.query = query;
    } else {
      this.filters.push(new canMap({name, query}));
    }

    this.updateCurrentFilter();
  },
  treeFilterReady({filterName}) {
    if (!this.shouldWaitForFilters) {
      return;
    }

    const filtersReady = this.filtersReady;

    // tree-status-filter is hidden. Mark it as already ready
    if (!this.statusFilterVisible) {
      filtersReady.add('tree-status-filter');
    }

    filtersReady.add(filterName);

    if (filtersReady.size === EXPECTED_FILTERS_COUNT) {
      this.onFilter();
    }
  },
  onFilter() {
    this.dispatch('onFilter');
  },
  openAdvancedFilter() {
    const advancedSearch = this.advancedSearch;

    // serialize "appliedFilterItems" before set to prevent changing of
    // "appliedFilterItems" object by changing of "filterItems" object.
    // Without "serialization" we copy reference of "appliedFilterItems" to "filterItems".
    advancedSearch.attr('filterItems',
      advancedSearch.attr('appliedFilterItems').serialize());

    advancedSearch.attr('mappingItems',
      advancedSearch.attr('appliedMappingItems').serialize());

    advancedSearch.attr('parentItems',
      advancedSearch.attr('appliedParentItems').serialize());

    if (isObjectContextPage() && !advancedSearch.attr('parentInstance')) {
      advancedSearch.attr('parentInstance',
        AdvancedSearch.create.parentInstance(this.parentInstance));

      // remove duplicates
      const parentItems = filterParentItems(
        advancedSearch.attr('parentInstance'),
        advancedSearch.attr('parentItems'));

      advancedSearch.attr('parentItems', parentItems);
    }

    advancedSearch.attr('open', true);
    this.filterIsDirty = false;
  },
  resetAppliedSavedSearch() {
    this.advancedSearch.attr('selectedSavedSearch', null);
    this.savedSearchPermalink = null;

    this.triggerSearchPermalink(false);
  },
  applyAdvancedFilters(isSavedSearchFromRoute = false) {
    if (isSavedSearchFromRoute) {
      this.setEmailImportSearchId(this.router);
    } else {
      // clean up route params from previous search
      this.cleanUpRoute();
      this.resetEmailImportSearchId();
    }
    const filters = this.advancedSearch.attr('filterItems').serialize();
    const mappings = this.advancedSearch.attr('mappingItems').serialize();
    const parents = this.advancedSearch.attr('parentItems').serialize();
    let request = canList();

    this.advancedSearch.attr('appliedFilterItems', filters);
    this.advancedSearch.attr('appliedMappingItems', mappings);
    this.advancedSearch.attr('appliedParentItems', parents);

    const builtFilters = AdvancedSearch.buildFilter(filters, request);
    const builtMappings = AdvancedSearch.buildFilter(mappings, request);
    const builtParents = AdvancedSearch.buildFilter(parents, request);
    let advancedFilters =
      QueryParser.joinQueries(builtFilters, builtMappings);
    advancedFilters = QueryParser.joinQueries(advancedFilters, builtParents);

    this.advancedSearch.attr('request', request);
    this.advancedSearch.attr('filter', advancedFilters);
    this.advancedSearch.attr('open', false);

    if (this.isSavedSearchShown) {
      // reset permalink
      this.savedSearchPermalink = null;
      this.applySavedSearch(this.advancedSearch.attr('selectedSavedSearch'));
    }

    this.onFilter();
  },
  applySavedSearch(selectedSavedSearch) {
    // apply hidden saved search (is_visible == false)
    if (!selectedSavedSearch || this.filterIsDirty) {
      // need to reset applied visible saved search (is_visible == true)
      this.resetAppliedSavedSearch();

      const filters = AdvancedSearch
        .getFilters(this.advancedSearch.serialize());
      const savedSearch = new SavedSearch({
        search_type: 'AdvancedSearch',
        object_type: this.modelName,
        is_visible: false,
        filters,
      });
      this.appliedSavedSearch = savedSearch;
    } else {
      const widgetId = this.widgetId;
      const permalink = AdvancedSearch
        .buildSearchPermalink(selectedSavedSearch.id, widgetId);

      this.savedSearchPermalink = permalink;
      this.appliedSavedSearch = selectedSavedSearch.serialize();
    }

    this.triggerSearchPermalink(true);
  },
  applySavedSearchPermalink() {
    if (this.savedSearchPermalink) {
      // permalink is already exist.
      this.savePermalinkToClipboard(this.savedSearchPermalink);
      return;
    }

    const appliedSavedSearch = this.appliedSavedSearch;
    const widgetId = this.widgetId;

    if (appliedSavedSearch.id) {
      // build permalink by current saved search id
      const permalink = AdvancedSearch
        .buildSearchPermalink(appliedSavedSearch.id, widgetId);
      this.savePermalinkToClipboard(permalink);
      return;
    }

    if (appliedSavedSearch && !appliedSavedSearch.is_visible) {
      // need to save search before build permalink
      // applied saved is hidden (is_visible == false)
      return this.saveHiddenSavedSearch(appliedSavedSearch, widgetId);
    }
  },
  saveHiddenSavedSearch(appliedSavedSearch, widgetId) {
    return appliedSavedSearch.save().then((savedSearch) => {
      const permalink = AdvancedSearch
        .buildSearchPermalink(savedSearch.id, widgetId);
      this.savePermalinkToClipboard(permalink);
    }, (err) => {
      handleAjaxError(err);
      this.triggerSearchPermalink(false);
    }).always(() => {
      this.appliedSavedSearch = null;
    });
  },
  savePermalinkToClipboard(savedSearchPermalink) {
    const notify = () =>
      notifier('info', 'Link has been copied to your clipboard.');
    if (navigator.clipboard) {
      // navigator.clipboard is only supported for pages served over HTTPS and for localhost
      navigator.clipboard.writeText(savedSearchPermalink).then(() => {
        notify();
      });
    } else {
      const elem = document.createElement('textarea');
      elem.style.position = 'absolute';
      elem.style.left = '-9999px';
      elem.setAttribute('readonly', '');
      elem.value = savedSearchPermalink;

      document.body.appendChild(elem);
      elem.select();
      document.execCommand('copy');
      document.body.removeChild(elem);
      notify();
    }
    this.savedSearchPermalink = savedSearchPermalink;
  },
  removeAdvancedFilters() {
    this.advancedSearch.attr('appliedFilterItems', canList());
    this.advancedSearch.attr('appliedMappingItems', canList());
    this.advancedSearch.attr('request', canList());
    this.advancedSearch.attr('filter', null);
    this.advancedSearch.attr('open', false);
    this.cleanUpRoute();
    this.resetAppliedSavedSearch();
    this.onFilter();
  },
  resetAdvancedFilters() {
    this.advancedSearch.attr('filterItems', canList());
    this.advancedSearch.attr('mappingItems', canList());
    this.advancedSearch.attr('parentItems', canList());
  },
  searchModalClosed() {
    this.advancedSearch.attr('selectedSavedSearch', null);
  },
  updateCurrentFilter() {
    const filters = makeArray(this.filters);
    let additionalFilter = this.additionalFilter;
    let advancedSearchFilter = this.advancedSearch.attr('filter');
    let advancedSearchRequest = this.advancedSearch.attr('request');

    if (advancedSearchFilter && advancedSearchFilter.serialize) {
      this.currentFilter = {
        filter: advancedSearchFilter.serialize(),
        request: advancedSearchRequest,
      };
      return;
    }

    if (additionalFilter) {
      additionalFilter = QueryParser.parse(additionalFilter);
    }

    const filter = filters
      .filter((options) => options.query)
      .reduce(concatFilters, additionalFilter);

    this.currentFilter = {
      filter,
      request: advancedSearchRequest,
    };
  },
  cleanUpRoute() {
    router.removeAttr('saved_search');
    router.removeAttr('labels');
  },
  resetEmailImportSearchId() {
    this.emailImportSearchId = null;
  },
  setEmailImportSearchId(router) {
    const searchId = Number(router.attr('saved_search'));
    const isEmailImportSearch = router.attr('labels') === 'Import Email';

    if (isEmailImportSearch && searchId) {
      this.emailImportSearchId = searchId;
      notifier(
        'info',
        'The filter query refers to the '
          + 'report you\'ve received on your email.'
      );
    } else {
      this.emailImportSearchId = null;
    }
  },
});

export default canComponent.extend({
  tag: 'tree-view-filter',
  view: canStache(template),
  ViewModel,
  events: {
    inserted() {
      if (isLoadSavedSearch(this.viewModel)) {
        loadSavedSearch(this.viewModel);
        this.viewModel.shouldWaitForFilters = false;
      }
    },
    '{viewModel.advancedSearch} selectedSavedSearch'() {
      // applied saved search filter. Current filter is NOT dirty
      this.viewModel.filterIsDirty = false;
    },
    '{viewModel.advancedSearch.filterItems} change'() {
      // filterItems changed. Current filter is dirty
      this.viewModel.filterIsDirty = true;
    },
    '{viewModel.advancedSearch.mappingItems} change'() {
      // mappingItems changed. Current filter is dirty
      this.viewModel.filterIsDirty = true;
    },
    '{viewModel.router} saved_search'() {
      if (isLoadSavedSearch(this.viewModel)
      && this.viewModel.loading === false) {
        loadSavedSearch(this.viewModel);
      }
    },
    '{viewModel.advancedSearch} change'() {
      this.viewModel.updateCurrentFilter();
    },
    '{pubSub} applySavedSearchPermalink'(pubSub, ev) {
      if (ev.widgetId === this.viewModel.widgetId) {
        this.viewModel.applySavedSearchPermalink();
      }
    },
    '{pubSub} savedSearchSelected'(pubSub, ev) {
      const currentModelName = this.viewModel.modelName;
      const isCurrentModelName = currentModelName === ev.savedSearch.modelName;
      if (ev.searchType !== 'AdvancedSearch' || !isCurrentModelName) {
        return;
      }

      selectSavedSearchFilter(
        this.viewModel.advancedSearch,
        ev.savedSearch
      );
    },
  },
});

const isLoadSavedSearch = (viewModel) => {
  return !!viewModel.router.attr('saved_search');
};

const processNotExistedSearch = (viewModel) => {
  notifier('warning', 'Saved search doesn\'t exist');
  viewModel.removeAdvancedFilters();
};

export const loadSavedSearch = (viewModel) => {
  const searchId = viewModel.router.attr('saved_search');
  viewModel.loading = true;

  return SavedSearch.findOne({id: searchId}).then((response) => {
    const savedSearch = response.SavedSearch;

    if (savedSearch &&
      savedSearch.object_type === viewModel.modelName &&
      savedSearch.search_type === 'AdvancedSearch') {
      const parsedSavedSearch = {
        ...AdvancedSearch.parseFilterJson(savedSearch.filters),
        id: savedSearch.id,
      };

      selectSavedSearchFilter(
        viewModel.advancedSearch,
        parsedSavedSearch
      );
      viewModel.applyAdvancedFilters(true);
    } else {
      // clear filter and apply default
      processNotExistedSearch(viewModel);
    }
  }).fail(() => {
    processNotExistedSearch(viewModel);
  }).always(() => {
    viewModel.loading = false;
  });
};

/**
 * Filter parentInstance items to remove duplicates
 * @param {Object} parentInstance - parent instance attribute of Advanced search
 * @param {Array} parentItems - parentItems attribute of Advanced search
 * @return {Array} - filtered parentItems
 */
export const filterParentItems = (parentInstance, parentItems) => {
  return parentItems.filter((item) =>
    item.value.id !== parentInstance.value.id ||
    item.value.type !== parentInstance.value.type);
};

/**
 * Select saved search filter to current advanced search
 * @param {can.Map} advancedSearch - current advanced search
 * @param {Object} savedSearch - saved search
 */
const selectSavedSearchFilter = (advancedSearch, savedSearch) => {
  const parentInstance = advancedSearch.attr('parentInstance');
  if (parentInstance && savedSearch.parentItems) {
    savedSearch.parentItems =
      filterParentItems(parentInstance, savedSearch.parentItems);
  }

  advancedSearch.attr('filterItems', savedSearch.filterItems);
  advancedSearch.attr('mappingItems', savedSearch.mappingItems);
  advancedSearch.attr('parentItems', savedSearch.parentItems);

  const selectedSavedSearch = {
    filterItems: savedSearch.filterItems,
    mappingItems: savedSearch.mappingItems,
    parentItems: savedSearch.parentItems,
    id: savedSearch.id,
  };

  // save selected saved search
  advancedSearch.attr('selectedSavedSearch', selectedSavedSearch);
};
