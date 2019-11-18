/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
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

let viewModel = canMap.extend({
  define: {
    icon: {
      type: 'string',
      get: function () {
        let type = this.attr('type') ? this.attr('type') : 'Total';
        let icon = titlesMap[type] ? titlesMap[type].icon : type;

        return icon.toLowerCase();
      },
    },
    title: {
      type: 'string',
      get: function () {
        let title = this.attr('type') ? this.attr('type') : 'Total';

        return titlesMap[title] ? titlesMap[title].title : title;
      },
    },
  },
  instance: null,
  isSpinnerVisible: false,
  isTitleVisible: true,
  extraCssClass: '',
  type: '',
  count: 0,
  /**
   * Just to avoid multiple dispatching of updateCounter event,
   * we lock it. It helps us to avoid extra queries, which might be produced
   * by load method.
   */
  lockUntilUpdate: false,
  load() {
    let instance = this.attr('instance');
    let type = this.attr('type');
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

      this.attr('isSpinnerVisible', false);
      this.attr('count', total);
    });
  },
  updateCounter() {
    const isLocked = this.attr('lockUntilUpdate');

    if (isLocked) {
      return;
    }

    this.attr('lockUntilUpdate', true);

    const callback = () => this.load()
      .finally(() => {
        this.attr('lockUntilUpdate', false);
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
  viewModel,
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

      if (viewModel.attr('type') === modelType) {
        viewModel.updateCounter();
      }
    },
  },
});
