/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canList from 'can-list';
import canMap from 'can-map';
import canComponent from 'can-component';
import {
  buildParam,
  batchRequestsWithPromise as batchRequests,
} from '../../plugins/utils/query-api-utils';
import '../object-list/object-list';
import template from './related-comments.stache';

/**
 * Mapped objects view component
 */
export default canComponent.extend({
  tag: 'related-comments',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      emptyMessage: {
        type: 'string',
        value: 'None',
      },
      mappedItems: {
        Value: canList,
      },
      requireLimit: {
        get: function () {
          return this.attr('mappedItems.length') > this.attr('visibleItems');
        },
      },
      showItems: {
        type: canList,
        get: function () {
          return this.attr('showAll') ?
            this.attr('mappedItems') :
            this.attr('mappedItems').slice(0, this.attr('visibleItems'));
        },
      },
      showAll: {
        value: false,
        type: Boolean,
      },
      showAllButtonText: {
        get: function () {
          return !this.attr('showAll') ?
            'Show All (' + this.attr('mappedItems.length') + ')' :
            'Show Less';
        },
      },
      visibleItems: {
        type: Number,
        value: 5,
      },
    },
    isLoading: false,
    parentInstance: null,
    selectedItem: {},
    filter: {
      only: [],
      exclude: [],
    },
    toggleShowAll: function () {
      let isShown = this.attr('showAll');
      this.attr('showAll', !isShown);
    },
    getObjectQuery: function () {
      let relevantFilters = [{
        type: this.attr('parentInstance.type'),
        id: this.attr('parentInstance.id'),
        operation: 'relevant',
      }];

      return buildParam('Comment', {}, relevantFilters, [], []);
    },
    async requestQuery(query) {
      try {
        this.attr('isLoading', true);

        const response = await batchRequests(query);
        const {values} = Object.values(response)[0];
        return values.map((item) => ({
          instance: item,
          isSelected: false,
        }));
      } catch {
        return [];
      } finally {
        this.attr('isLoading', false);
      }
    },
    loadObjects: function () {
      let query = this.getObjectQuery();
      return this.requestQuery(query);
    },
    setMappedObjects: function () {
      let objects = this.loadObjects();
      this.attr('mappedItems').replace(objects);
    },
  }),
  init: function () {
    this.viewModel.setMappedObjects();
  },
  events: {
    '{viewModel.parentInstance} refreshInstance': function () {
      this.viewModel.setMappedObjects();
    },
  },
});
