/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import {
  buildCountParams,
  batchRequestsWithPromise as batchRequests,
} from '../../plugins/utils/query-api-utils';
import {getMappingList} from '../../models/mappers/mappings';
import {REFRESH_MAPPED_COUNTER} from '../../events/event-types';
import template from './mapped-counter.stache';

let titlesMap = {
  Total: {
    title: 'Total',
    icon: 'list-alt',
  },
  CycleTaskGroupObjectTask: {
    title: 'Total',
    icon: 'calendar-check-o',
  },
};

const ViewModel = canDefineMap.extend({
  icon: {
    type: 'string',
    get() {
      let type = this.type || 'Total';
      let icon = titlesMap[type] ? titlesMap[type].icon : type;

      return icon.toLowerCase();
    },
  },
  title: {
    type: 'string',
    get() {
      let title = this.type || 'Total';
      return titlesMap[title] ? titlesMap[title].title : title;
    },
  },
  instance: {
    value: null,
  },
  isSpinnerVisible: {
    value: false,
  },
  isTitleVisible: {
    value: true,
  },
  extraCssClass: {
    value: '',
  },
  type: {
    value: '',
  },
  count: {
    value: 0,
  },
  /**
   * Just to avoid multiple dispatching of updateCounter event,
   * we lock it. It helps us to avoid extra queries, which might be produced
   * by load method.
   */
  lockUntilUpdate: {
    value: false,
  },
  load() {
    let instance = this.instance;
    let type = this.type;
    let relevant = {
      id: instance.id,
      type: instance.type,
    };
    let types = type ? [type] : getMappingList(instance.type);
    let countQuery = buildCountParams(types, relevant);

    return Promise.all(
      countQuery.map(batchRequests)
    ).then((counts) => {
      let total = types.reduce((count, type, ind) => {
        return count + counts[ind][type].total;
      }, 0);

      this.isSpinnerVisible = false;
      this.count = total;
    });
  },
  updateCounter() {
    const isLocked = this.lockUntilUpdate;

    if (isLocked) {
      return;
    }

    this.lockUntilUpdate = true;

    const callback = () => this.load()
      .finally(() => {
        this.lockUntilUpdate = false;
      });

    this.dispatch({
      type: 'updateCounter',
      callback,
    });
  },
});

export default canComponent.extend({
  tag: 'mapped-counter',
  view: canStache(template),
  leakScope: true,
  ViewModel,
  events: {
    inserted: function () {
      let vm = this.viewModel;
      let promise = vm.load();

      if (vm.addContent) {
        vm.addContent(promise);
      }
    },
    [`{viewModel.instance} ${REFRESH_MAPPED_COUNTER.type}`]([instance], {
      modelType,
    }) {
      const viewModel = this.viewModel;

      if (viewModel.type === modelType) {
        viewModel.updateCounter();
      }
    },
  },
});
