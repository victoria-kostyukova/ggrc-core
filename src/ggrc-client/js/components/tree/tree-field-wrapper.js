/*
  Copyright (C) 2019 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loForEach from 'lodash/forEach';
import makeArray from 'can-util/js/make-array/make-array';
import canMap from 'can-map';
import canComponent from 'can-component';
import RefreshQueue from '../../models/refresh_queue';

const viewModel = canMap.extend({
  field: 'title',
  source: null,
  type: null,
  items: [],
  init: function () {
    this.refreshItems();
  },
  refreshItems: function () {
    this.getItems()
      .then((data) => {
        let items = data.map((item) => item[this.attr('field')]);
        this.attr('items', items);
      });
  },
  getItems: function () {
    let source = this.attr('source');
    let sourceList = Array.isArray(source) ? source : makeArray(source);
    let deferred = $.Deferred();
    let readyItemsList;

    if (!sourceList.length) {
      return deferred.resolve([]);
    }

    readyItemsList = sourceList.filter((item) => item[this.attr('field')]);

    if (readyItemsList.length === sourceList.length) {
      deferred.resolve(sourceList);
    } else {
      this.loadItems(sourceList)
        .then(function (data) {
          deferred.resolve(data);
        })
        .fail(function () {
          deferred.resolve([]);
        });
    }

    return deferred;
  },
  loadItems: function (items) {
    const rq = new RefreshQueue();
    const Type = this.attr('type');

    loForEach(items, function (item) {
      rq.enqueue(Type.model(item));
    });

    return rq.trigger();
  },
});

export default canComponent.extend({
  tag: 'tree-field-wrapper',
  leakScope: true,
  viewModel,
  events: {
    '{viewModel} source': function () {
      this.viewModel.refreshItems();
    },
  },
});
