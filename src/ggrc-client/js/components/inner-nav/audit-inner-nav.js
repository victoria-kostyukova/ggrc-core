/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canComponent from 'can-component';
import template from './audit-inner-nav.stache';
import './inner-nav-item';
import './inner-nav-collapse';
import '../add-tab-button/add-tab-button';
import InnerNavVM from './inner-nav-vm';
import {isDashboardEnabled} from '../../plugins/utils/dashboards-utils';

export default canComponent.extend({
  tag: 'audit-inner-nav',
  leakScope: false,
  view: canStache(template),
  viewModel: InnerNavVM.extend({
    priorityTabs: null,
    notPriorityTabs: null,
    /**
     * Splits tabs by priority
     */
    setTabsPriority() {
      let widgets = this.attr('widgetList');
      let instance = this.attr('instance');

      let priorityTabsNum = 5 + isDashboardEnabled(instance);
      this.attr('priorityTabs', widgets.slice(0, priorityTabsNum));
      this.attr('notPriorityTabs', widgets.slice(priorityTabsNum));
    },
  }),
  events: {
    inserted() {
      this.viewModel.initVM();
      this.viewModel.setTabsPriority();
    },
    '{counts} change'(counts, event, name, action, count) {
      this.viewModel.setWidgetCount(name, count);
    },
  },
});
