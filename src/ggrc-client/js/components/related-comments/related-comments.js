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
  batchRequests,
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
    requestQuery: function (query) {
      let dfd = $.Deferred();
      this.attr('isLoading', true);

      batchRequests(query)
        .done(function (response) {
          let type = Object.keys(response)[0];
          let values = response[type].values;
          let result = values.map(function (item) {
            return {instance: item, isSelected: false};
          });
          dfd.resolve(result);
        })
        .fail(function () {
          dfd.resolve([]);
        })
        .always(function () {
          this.attr('isLoading', false);
        }.bind(this));
      return dfd;
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
