/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loReduce from 'lodash/reduce';
import loFindIndex from 'lodash/findIndex';
import loFind from 'lodash/find';
import makeArray from 'can-util/js/make-array/make-array';
import canStache from 'can-stache';
import canMap from 'can-map';
import canList from 'can-list';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import './mapper-results-item';
import './mapper-results-items-header';
import './mapper-results-columns-configuration';
import '../related-objects/related-assessments';
import '../object-list/object-list';
import '../object-selection/object-selection';
import '../mega-relation-selection-item/mega-relation-selection-item';
import '../tree-pagination/tree-pagination';
import template from './templates/mapper-results.stache';
import * as StateUtils from '../../plugins/utils/state-utils';
import * as TreeViewUtils from '../../plugins/utils/tree-view-utils';
import {
  transformQueryToSnapshot,
  toObject,
} from '../../plugins/utils/snapshot-utils';
import {
  buildRelevantIdsQuery,
  buildParam,
  batchRequestsWithPromise as batchRequests,
} from '../../plugins/utils/query-api-utils';
import * as AdvancedSearch from '../../plugins/utils/advanced-search-utils';
import Pagination from '../base-objects/pagination';
import tracker from '../../tracker';
import Snapshot from '../../models/service-models/snapshot';
import * as businessModels from '../../models/business-models';
import QueryParser from '../../generated/ggrc-filter-query-parser';
import {isMegaMapping as isMegaMappingUtil} from '../../plugins/utils/mega-object-utils';
import {OBJECT_DESTROYED} from '../../events/event-types';

const DEFAULT_PAGE_SIZE = 10;

const ViewModel = canDefineMap.extend({
  paging: {
    value() {
      return new Pagination({pageSizeSelect: [10, 25, 50]});
    },
  },
  isMegaMapping: {
    get() {
      return isMegaMappingUtil(this.object, this.type);
    },
  },
  serviceColumnsEnabled: {
    get() {
      return this.columns.service.length;
    },
  },
  isWorkflowPart: {
    get() {
      const workflowParts
        = ['CycleTaskGroupObjectTask', 'TaskGroup', 'TaskGroupTask'];
      return workflowParts.includes(this.type) && this.searchOnly;
    },
  },
  columns: {
    value: () => ({
      selected: [],
      available: [],
      service: [],
    }),
  },
  sort: {
    value: () => ({
      key: null,
      direction: null,
    }),
  },
  isLoading: {
    value: false,
  },
  items: {
    value: () => [],
  },
  allItems: {
    value: () => [],
  },
  allSelected: {
    value: false,
  },
  baseInstance: {
    value: null,
  },
  filterItems: {
    Type: canList,
    value: () => [],
  },
  mappingItems: {
    Type: canList,
    value: () => [],
  },
  statusItem: {
    Type: canMap,
    value: () => ({}),
  },
  selected: {
    value: () => [],
  },
  selectionState: {
    value: () => ({}),
  },
  disableColumnsConfiguration: {
    value: false,
  },
  applyOwnedFilter: {
    value: false,
  },
  objectsPlural: {
    value: false,
  },
  relatedAssessments: {
    value: () => ({
      state: {
        open: false,
      },
      instance: null,
      show: false,
    }),
  },
  searchOnly: {
    value: false,
  },
  useSnapshots: {
    value: false,
  },
  relevantTo: {
    value: () => [],
  },
  objectGenerator: {
    value: false,
  },
  deferredList: {
    value: () => [],
  },
  disabledIds: {
    value: () => [],
  },
  megaRelationObj: {
    value: () => ({}),
  },
  itemDetailsViewType: {
    value: '',
  },
  _setItemsTimeout: {
    value: null,
  },
  isBeforeLoad: {
    value: false,
  },
  setItems() {
    const stopFn = tracker.start(this.type,
      tracker.USER_JOURNEY_KEYS.NAVIGATION,
      tracker.USER_ACTIONS.ADVANCED_SEARCH_FILTER);

    this.items.replace([]);
    this.isLoading = true;
    return this.load()
      .then((items) => {
        this.items = items;
        this.setColumnsConfiguration();
        this.setRelatedAssessments();
        this.isBeforeLoad = false;
        stopFn();
      })
      .finally(() => {
        this.isLoading = false;
      });
  },
  setColumnsConfiguration() {
    let columns =
      TreeViewUtils.getColumnsForModel(
        this.getDisplayModel().model_singular
      );

    this.columns.available = columns.available;
    this.columns.selected = columns.selected;
    this.disableColumnsConfiguration = columns.disableConfiguration;

    if (this.isMegaMapping) {
      this.columns.service =
        this.getDisplayModel().tree_view_options.mega_attr_list;
    } else {
      this.columns.service = [];
    }
  },
  setSortingConfiguration() {
    let sortingInfo = TreeViewUtils.getSortingForModel(
      this.getDisplayModel().model_singular
    );

    this.sort.key = sortingInfo.key;
    this.sort.direction = sortingInfo.direction;
  },
  setRelatedAssessments() {
    let Model = this.getDisplayModel();
    if (this.useSnapshots) {
      this.relatedAssessments.show = false;
      return;
    }
    this.relatedAssessments.show =
      !!Model.tree_view_options.show_related_assessments;
  },
  resetSearchParams() {
    this.paging.attr('current', 1);
    this.paging.attr('pageSize', DEFAULT_PAGE_SIZE);
    this.setSortingConfiguration();
  },
  onSearch() {
    this.resetSearchParams();
    this.selectionState.dispatch('resetSelection');
    this.setItemsDebounced();
  },
  prepareRelevantQuery() {
    let relevantList = this.relevantTo || [];
    let filters = relevantList.map((relevant) => {
      return {
        type: relevant.type,
        operation: 'relevant',
        id: relevant.id,
      };
    });
    return filters;
  },
  prepareRelatedQuery(filter, operation) {
    if (!this.baseInstance) {
      return null;
    }

    return buildRelevantIdsQuery(this.type, {}, {
      type: this.baseInstance.attr('type'),
      id: this.baseInstance.attr('id'),
      operation: operation || 'relevant',
    }, filter);
  },
  prepareUnlockedFilter() {
    let filterString = StateUtils.unlockedFilter();
    return QueryParser.parse(filterString);
  },
  prepareOwnedFilter() {
    let userId = GGRC.current_user.id;
    return {
      expression: {
        object_name: 'Person',
        op: {
          name: 'owned',
        },
        ids: [userId],
      },
    };
  },
  shouldApplyUnlockedFilter(modelName) {
    return modelName === 'Audit' && !this.searchOnly;
  },
  loadAllItems() {
    this.allItems = this.loadAllItemsIds();
  },
  getQuery(queryType, addPaging, isMegaMapping) {
    let result = {};
    let paging = {};
    let modelName = this.type;
    let query;
    let relatedQuery;

    // prepare QueryAPI data from advanced search
    let request = [];
    let status;
    let filters =
      AdvancedSearch.buildFilter(this.filterItems.attr(), request);
    let mappings =
      AdvancedSearch.buildFilter(this.mappingItems.attr(), request);
    let advancedFilters = QueryParser.joinQueries(filters, mappings);

    // the edge case caused by stateless objects
    if (this.statusItem.attr('value.items')) {
      status =
        AdvancedSearch.buildFilter([this.statusItem.attr()], request);
      advancedFilters = QueryParser.joinQueries(advancedFilters, status);
    }
    result.request = request;

    // prepare pagination
    if (addPaging) {
      paging.current = this.paging.attr('current');
      paging.pageSize = this.paging.attr('pageSize');

      let sort = this.sort;
      let defaultSort = this.defaultSort;

      if (sort && sort.key) {
        paging.sort = [sort];
      } else if (defaultSort && defaultSort.length) {
        paging.sort = defaultSort;
      }
    }
    if (this.shouldApplyUnlockedFilter(modelName)) {
      advancedFilters = QueryParser.joinQueries(
        advancedFilters,
        this.prepareUnlockedFilter());
    }

    if (this.applyOwnedFilter) {
      advancedFilters = QueryParser.joinQueries(
        advancedFilters,
        this.prepareOwnedFilter());
    }

    // prepare and add main query to request
    query = buildParam(
      modelName,
      paging,
      this.prepareRelevantQuery(),
      null,
      advancedFilters);
    if (this.useSnapshots) {
      // Transform Base Query to Snapshot
      query = transformQueryToSnapshot(query);
    }
    // Add Permission check
    query.permissions = (modelName === 'Person') ||
      this.searchOnly ? 'read' : 'update';
    query.type = queryType || 'values';
    // we need it to find result in response from backend
    result.queryIndex = request.push(query) - 1;

    // mega object needs special query: parent and child op,
    // instead of 'relevant'
    if (isMegaMapping) {
      const relations = ['parent', 'child'];

      relations.forEach((relation) => {
        relatedQuery = this.prepareRelatedQuery(filters, relation);

        result[`${relation}QueryIndex`] = request.push(relatedQuery) - 1;
      });
    } else {
      // prepare and add related query to request
      // the query is used to select already mapped items
      relatedQuery = this.prepareRelatedQuery(filters);
      if (relatedQuery) {
        if (this.useSnapshots) {
          // Transform Related Query to Snapshot
          relatedQuery = transformQueryToSnapshot(relatedQuery);
        }
        // we need it to find result in response from backend
        result.relatedQueryIndex = request.push(relatedQuery) - 1;
      }
    }

    return result;
  },
  getModelKey() {
    return this.useSnapshots ?
      Snapshot.model_singular :
      this.type;
  },
  getDisplayModel() {
    return businessModels[this.type];
  },
  setDisabledItems(isMegaMapping, allItems, relatedData, type) {
    if (!this.objectGenerator && relatedData
      && !this.searchOnly) {
      let disabledIds;

      if (isMegaMapping) {
        disabledIds = loReduce(relatedData, (result, val) => {
          return result.concat(val[type].ids);
        }, []);
      } else {
        disabledIds = relatedData[type].ids;
      }

      this.disabledIds = disabledIds;
      allItems.forEach((item) => {
        item.isDisabled = disabledIds.indexOf(item.data.id) !== -1;
      });
    }
  },
  setSelectedItems(allItems) {
    let selectedItems = makeArray(this.selected);

    allItems.forEach((item) => {
      item.isSelected =
        selectedItems.some((selectedItem) => {
          return selectedItem.id === item.id;
        });
      if (item.isSelected) {
        item.markedSelected = true;
      }
    });
  },
  setMegaRelations(allItems, relatedData, type) {
    const childIds = relatedData.child[type].ids;
    const parentIds = relatedData.parent[type].ids;
    const relationsObj = this.megaRelationObj;
    const defaultRelation = this.megaRelationObj.defaultValue;

    allItems.forEach((item) => {
      if (childIds.indexOf(item.id) > -1) {
        item.mapAsChild = true;
      } else if (parentIds.indexOf(item.id) > -1) {
        item.mapAsChild = false;
      } else if (relationsObj[item.id]) {
        item.mapAsChild = relationsObj[item.id] === 'child';
      } else {
        item.mapAsChild = defaultRelation === 'child';
      }
    });
  },
  disableItself(isMegaMapping, allItems) {
    const baseInstance = this.baseInstance;
    // check for baseInstance:
    // baseInstance is undefined in case of Global Search and some other
    // use cases (e.g. Assessment Snapshots)
    if (allItems.length && baseInstance) {
      if (baseInstance.type === allItems[0].type) {
        let disabledIds = this.disabledIds;
        disabledIds.push(baseInstance.id);
        this.disabledIds = disabledIds;

        let self = allItems.find((item) => item.id === baseInstance.id);
        if (self) {
          self.isDisabled = true;
          if (isMegaMapping) {
            self.mapAsChild = null;
            self.isSelf = true;
          }
        }
      }
    }
  },
  transformValue(value) {
    let Model = this.getDisplayModel();
    if (this.useSnapshots) {
      value.snapshotObject =
        toObject(value);
      value.revision.content =
        Model.model(value.revision.content);
      return value;
    }
    return Model.model(value);
  },
  async load() {
    try {
      const modelKey = this.getModelKey();
      const isMegaMapping = this.isMegaMapping;
      const query = this.getQuery('values', true, isMegaMapping);
      const responseArr = await Promise.all(
        query.request.map((request) => batchRequests(request))
      );
      const data = responseArr[query.queryIndex];

      const relatedData = this.getRelatedData(
        isMegaMapping,
        responseArr,
        query,
        modelKey,
      );

      let result =
        data[modelKey].values.map((value) => {
          return {
            id: value.id,
            type: value.type,
            data: this.transformValue(value),
            markedSelected: false,
          };
        });
      this.setSelectedItems(result);
      this.setDisabledItems(isMegaMapping, result, relatedData, modelKey);

      if (isMegaMapping) {
        this.setMegaRelations(result, relatedData, modelKey);
      }
      this.disableItself(isMegaMapping, result);

      // Update paging object
      this.paging.attr('total', data[modelKey].total);
      return result;
    } catch {
      return [];
    } finally {
      this.dispatch('loaded');
    }
  },
  getRelatedData(isMegaMapping, responseArr, query, modelKey) {
    return isMegaMapping ?
      this.buildMegaRelatedData(responseArr, query, modelKey) :
      this.buildRelatedData(responseArr, query, modelKey);
  },
  buildRelatedData(responseArr, query, type) {
    const deferredList = this.deferredList;
    let ids;
    let empty = {};
    let relatedData = responseArr[query.relatedQueryIndex];

    if (!deferredList || !deferredList.length) {
      return relatedData;
    } else if (!relatedData) {
      relatedData = {};
      relatedData[type] = {};
      ids = deferredList
        .map((item) => {
          return item.id;
        });
    } else {
      ids = deferredList
        .filter((item) => {
          return relatedData[item.type];
        })
        .map((item) => {
          return item.id;
        });

      if (!ids.length) {
        // return empty data
        empty[type] = {
          ids: [],
        };
        return empty;
      }
    }

    relatedData[type].ids = ids;
    return relatedData;
  },
  buildMegaRelatedData(responseArr, query) {
    const relatedData = {
      parent: responseArr[query.parentQueryIndex] || {},
      child: responseArr[query.childQueryIndex] || {},
    };

    return relatedData;
  },
  async loadAllItemsIds() {
    try {
      const modelKey = this.getModelKey();
      const queryType = 'ids';
      const query = this.getQuery(queryType, false);
      const responseArr = await Promise.all(
        query.request.map((request) => batchRequests(request))
      );
      const data = responseArr[query.queryIndex];
      const relatedData = responseArr[query.relatedQueryIndex];
      const values = data[modelKey][queryType];
      let result = values.map((item) => {
        const object = {
          id: item,
          type: modelKey,
        };

        if (this.useSnapshots) {
          object.child_type = this.type;
        }

        return object;
      });

      // Do not perform extra mapping validation in case object generation
      if (!this.objectGenerator && relatedData) {
        result = result.filter((item) => {
          return relatedData[modelKey].ids.indexOf(item.id) < 0;
        });
      }
      return result;
    } catch (e) {
      return [];
    }
  },
  setItemsDebounced() {
    clearTimeout(this._setItemsTimeout);
    this._setItemsTimeout = setTimeout(this.setItems.bind(this));
  },
  showRelatedAssessments(ev) {
    this.relatedAssessments.instance = ev.instance;
    this.relatedAssessments.state.open = true;
  },
  onItemDestroyed({itemId}) {
    const selectedItems = this.selected;
    const selectedIndex = loFindIndex(selectedItems,
      (item) => item.id === itemId);
    const selectedObject = loFind(this.items,
      (item) => item.id === itemId);
    // remove selection of destroyed item
    // if it was selected before deletion
    if (selectedIndex !== -1) {
      selectedItems.splice(selectedIndex, 1);
    }

    const paging = this.paging;
    const currentPageNumber = paging.attr('current');
    const needToGoToPrevPage = (
      currentPageNumber > 1 &&
      this.items.length === 1
    );

    if (needToGoToPrevPage) {
      paging.attr('current', currentPageNumber - 1);
    }

    this.setItems();
    if (this.baseInstance) {
      this.baseInstance.dispatch({
        ...OBJECT_DESTROYED,
        object: {
          id: itemId,
          type: selectedObject && selectedObject.type,
        },
      });
    }
  },
});

export default canComponent.extend({
  tag: 'mapper-results',
  view: canStache(template),
  leakScope: true,
  ViewModel,
  events: {
    '{viewModel} allSelected'([scope], ev, allSelected) {
      if (allSelected) {
        this.viewModel.loadAllItems();
      }
    },
    '{viewModel.paging} current'() {
      this.viewModel.setItemsDebounced();
    },
    '{viewModel.paging} pageSize'() {
      this.viewModel.setItemsDebounced();
    },
    '{viewModel.sort} key'() {
      this.viewModel.setItemsDebounced();
    },
    '{viewModel.sort} direction'() {
      this.viewModel.setItemsDebounced();
    },
  },
});
