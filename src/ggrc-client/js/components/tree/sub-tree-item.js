/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canComponent from 'can-component';
import BaseTreeItemVM from './tree-item-base-vm';
import './tree-item-extra-info';
import template from './templates/sub-tree-item.stache';
import CycleTaskGroupObjectTask from '../../models/business-models/cycle-task-group-object-task';
import {trigger} from 'can-event';

let ViewModel = BaseTreeItemVM.extend({
  // workaround an issue: "instance.is_mega" is not
  // handled properly in template
  isMega: {
    get() {
      return this.instance.attr('is_mega');
    },
  },
  dueDate: {
    get() {
      return this.instance.attr('next_due_date') ||
        this.instance.attr('end_date');
    },
  },
  dueDateCssClass: {
    get() {
      let isOverdue = this.instance.attr('isOverdue');
      return isOverdue ? 'state-overdue' : '';
    },
  },
  isCycleTaskGroupObjectTask: {
    get() {
      return this.instance instanceof CycleTaskGroupObjectTask;
    },
  },
  cssClasses: {
    get() {
      let classes = [];
      let instance = this.instance;

      if (instance.snapshot) {
        classes.push('snapshot');
      }

      if (this.extraCss) {
        classes = classes.concat(this.extraCss.split(' '));
      }

      return classes.join(' ');
    },
  },
  title: {
    get() {
      const instance = this.instance;
      return (
        instance.attr('title') ||
        instance.attr('name') ||
        instance.attr('email') || ''
      );
    },
  },
  itemSelector: {
    value: '.sub-item-content',
  },
  extraCss: {
    value: '',
  },
});

export default canComponent.extend({
  tag: 'sub-tree-item',
  view: canStache(template),
  leakScope: true,
  ViewModel,
  events: {
    inserted: function () {
      this.viewModel.$el = this.element;
    },
    '{viewModel.instance} destroyed'() {
      const element = $(this.element)
        .closest('tree-widget-container');
      trigger.call(element[0], 'refreshTree');
    },
  },
});
