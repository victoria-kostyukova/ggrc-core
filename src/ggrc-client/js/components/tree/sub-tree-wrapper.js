/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import makeArray from 'can-util/js/make-array/make-array';
import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import {
  DESTINATION_UNMAPPED,
  REFRESH_SUB_TREE,
} from '../../events/event-types';
import template from './templates/sub-tree-wrapper.stache';
import * as TreeViewUtils from '../../plugins/utils/tree-view-utils';
import {
  isObjectContextPage,
  getPageType,
} from '../../plugins/utils/current-page-utils';
import childModelsMap from './child-models-map';
import tracker from '../../tracker';
import Pagination from '../base-objects/pagination';

const ViewModel = canDefineMap.extend({
  dataIsReady: {
    value: false,
  },
  limitDepthTree: {
    value: 0,
  },
  depthFilter: {
    value: '',
  },
  parent: {
    value: null,
  },
  directlyItems: {
    value: () => [],
  },
  notDirectlyItems: {
    value: () => [],
  },
  deepLevel: {
    value: 0,
  },
  _collapseAfterUnmapCallBack: {
    value: null,
  },
  parentModel: {
    get() {
      return this.parent.type;
    },
  },
  parentId: {
    get() {
      return this.parent.id;
    },
  },
  showAllRelatedLink: {
    get() {
      return this.parent ? this.parent.viewLink : '';
    },
  },
  loading: {
    type: 'boolean',
    value: false,
  },
  notDirectlyExpanded: {
    type: 'boolean',
    value: false,
  },
  getDepthFilter: {
    value: null,
  },
  needToSplit: {
    get() {
      return isObjectContextPage() &&
        getPageType() !== 'Workflow' &&
        this.notDirectlyItems.length;
    },
  },
  notResult: {
    type: 'boolean',
    value: false,
  },
  drawRelated: {
    type: 'boolean',
    value: false,
  },
  showMore: {
    type: 'boolean',
    value: false,
  },
  isOpen: {
    type: 'boolean',
    set(newValue, setValue) {
      let isReady = this.dataIsReady;

      if (!isReady && newValue) {
        if (!this.childModels) {
          this.initializeChildModels();
        }
        this.loadItems().then(function () {
          setValue(newValue);
        });
      } else {
        setValue(newValue);
      }
    },
  },
  paging: {
    value() {
      return new Pagination({
        pageSize: 25, pageSizeSelect: [25, 50, 100],
      });
    },
  },
  showPagination: {
    get() {
      return this.parentModel === 'CycleTaskGroup';
    },
  },
  childModels: {
    set(models, setResult) {
      if (!this.dataIsReady) {
        setResult(models);
      } else if (this.dataIsReady && !this.isOpen) {
        this.dataIsReady = false;
        setResult(models);
      } else {
        this.loadItems(models).then(function () {
          setResult(models);
        });
      }
    },
  },
  cssClasses: {
    get() {
      let classes = [];

      if (this.loading) {
        classes.push('loading');
      }

      return classes.join(' ');
    },
  },
  initializeChildModels() {
    let parentModel = this.parentModel;
    let savedModels = childModelsMap.getModels(parentModel);
    let defaultModels = TreeViewUtils.getModelsForSubTier(parentModel);

    this.childModels = savedModels || defaultModels.selected;

    childModelsMap.container.bind(parentModel, (ev) => {
      this.childModels =
        childModelsMap.getModels(parentModel) || defaultModels.selected;
    });
  },
  expandNotDirectlyRelated() {
    let isExpanded = this.notDirectlyExpanded;
    this.notDirectlyExpanded = !isExpanded;
  },
  /**
   *
   * @param {Array} [widgetIds] - ids of selected widgets
   * e.g. model names, model names with _version, _parent, _child postfixes
   * @return {*}
   */
  loadItems(widgetIds) {
    let parentType = this.parentModel;
    let parentId = this.parentId;
    let deepLevel = this.deepLevel;
    let filter = this.getDepthFilter(deepLevel);

    widgetIds = widgetIds || this.childModels || [];
    widgetIds = makeArray(widgetIds);

    if (!widgetIds.length) {
      this.directlyItems = [];
      this.notDirectlyItems = [];
      return $.Deferred().resolve();
    }

    const pageInfo = this.showPagination ? this.paging : {};
    const stopFn = tracker.start(parentType,
      tracker.USER_JOURNEY_KEYS.TREEVIEW,
      tracker.USER_ACTIONS.TREEVIEW.SUB_TREE_LOADING);

    this.loading = true;

    return TreeViewUtils
      .loadItemsForSubTier(widgetIds, parentType, parentId, filter, pageInfo)
      .then((result) => {
        stopFn();
        this.loading = false;
        this.directlyItems = result.directlyItems;
        this.notDirectlyItems = result.notDirectlyItems;
        this.dataIsReady = true;
        this.showMore = result.showMore;
        this.paging.total = result.total;

        if (!result.directlyItems.length && !result.notDirectlyItems.length) {
          this.notResult = true;
        }

        // bind 'destinationUnmapped' event
        this.directlyItems.forEach((item) => {
          if (item) {
            item.bind(DESTINATION_UNMAPPED.type,
              this._collapseAfterUnmapCallBack);
          }
        });
      }, stopFn.bind(null, true));
  },
  refreshItems() {
    if (this.isOpen) {
      this.loadItems();
    } else {
      // mark the sub tree items should be refreshed,
      // when sub tree will be open
      this.dataIsReady = false;
    }
  },
  collapseAfterUnmap() {
    // unbind 'destinationUnmapped' event
    this.directlyItems.forEach((item) => {
      if (item) {
        item.unbind(DESTINATION_UNMAPPED.type,
          this._collapseAfterUnmapCallBack);
      }
    });

    this.dataIsReady = false;
    this.isOpen = false;
    this.dispatch('collapseSubtree');
  },
  init() {
    this._collapseAfterUnmapCallBack = this.collapseAfterUnmap.bind(this);
  },
});

const events = {
  inserted() {
    let parents = this.element.parents('sub-tree-wrapper');
    this.viewModel.deepLevel = parents.length;
  },
  [`{viewModel.parent} ${REFRESH_SUB_TREE.type}`]() {
    this.viewModel.refreshItems();
  },
  '{viewModel.paging} current'() {
    this.viewModel.refreshItems();
  },
  '{viewModel.paging} pageSize'() {
    this.viewModel.refreshItems();
  },
};

export default canComponent.extend({
  tag: 'sub-tree-wrapper',
  view: canStache(template),
  leakScope: true,
  ViewModel,
  events,
});
