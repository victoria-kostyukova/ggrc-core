/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loForEach from 'lodash/forEach';
import makeArray from 'can-util/js/make-array/make-array';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import RefreshQueue from '../../models/refresh-queue';

const ViewModel = canDefineMap.extend({
  field: {
    value: 'title',
  },
  source: {
    value: null,
  },
  type: {
    value: null,
  },
  items: {
    value: () => [],
  },
  init() {
    this.refreshItems();
  },
  refreshItems() {
    this.getItems()
      .then((data) => {
        let items = data.map((item) => item[this.field]);
        this.items = items;
      });
  },
  getItems: function () {
    let source = this.source;
    let sourceList = Array.isArray(source) ? source : makeArray(source);
    let deferred = $.Deferred();
    let readyItemsList;

    if (!sourceList.length) {
      return deferred.resolve([]);
    }

    readyItemsList = sourceList.filter((item) => item[this.field]);

    if (readyItemsList.length === sourceList.length) {
      deferred.resolve(sourceList);
    } else {
      this.loadItems(sourceList)
        .then((data) => {
          deferred.resolve(data);
        })
        .fail(() => {
          deferred.resolve([]);
        });
    }

    return deferred;
  },
  loadItems(items) {
    const rq = new RefreshQueue();
    const Type = this.type;

    loForEach(items, (item) => {
      rq.enqueue(Type.model(item));
    });

    return rq.trigger();
  },
});

export default canComponent.extend({
  tag: 'tree-field-wrapper',
  leakScope: true,
  ViewModel,
  events: {
    // this event is called when object was just created or redefined
    '{viewModel} source'() {
      this.viewModel.refreshItems();
    },
    // this event is called when object was updated with data
    '{viewModel} source.id'() {
      this.viewModel.refreshItems();
    },
  },
});
