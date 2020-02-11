/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import '../dropdown/dropdown-component';
import '../numberbox/numberbox-component';
import './modal-component-id';
import template from './templates/modal-issue-tracker-config-fields.stache';
import {loadComponentIds} from '../../plugins/utils/issue-tracker-utils';

export default canComponent.extend({
  tag: 'modal-issue-tracker-config-fields',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    instance: {},
    componentIds: [],
    componentIdsLoading: false,
    loadComponentIds() {
      this.attr('componentIdsLoading', true);

      return loadComponentIds().then((ids) => {
        this.attr('componentIds', ids);
      }).finally(() => {
        this.attr('componentIdsLoading', false);
      });
    },
  }),
  events: {
    inserted() {
      this.viewModel.loadComponentIds();
    },
  },
});
