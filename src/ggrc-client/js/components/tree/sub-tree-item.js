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

let viewModel = BaseTreeItemVM.extend({
  define: {
    // workaround an issue: "instance.is_mega" is not
    // handled properly in template
    isMega: {
      get() {
        return this.attr('instance.is_mega');
      },
    },
    dueDate: {
      type: 'date',
      get: function () {
        return this.attr('instance.next_due_date') ||
          this.attr('instance.end_date');
      },
    },
    dueDateCssClass: {
      type: 'string',
      get: function () {
        let isOverdue = this.attr('instance.isOverdue');
        return isOverdue ? 'state-overdue' : '';
      },
    },
    isCycleTaskGroupObjectTask: {
      type: 'boolean',
      get: function () {
        return this.attr('instance') instanceof CycleTaskGroupObjectTask;
      },
    },
    cssClasses: {
      type: String,
      get: function () {
        let classes = [];
        let instance = this.attr('instance');

        if (instance.snapshot) {
          classes.push('snapshot');
        }

        if (this.attr('extraCss')) {
          classes = classes.concat(this.attr('extraCss').split(' '));
        }

        return classes.join(' ');
      },
    },
    title: {
      type: String,
      get() {
        const instance = this.attr('instance');
        return (
          instance.attr('title') ||
          instance.attr('name') ||
          instance.attr('email') || ''
        );
      },
    },
  },
  itemSelector: '.sub-item-content',
  extraCss: '',
});

export default canComponent.extend({
  tag: 'sub-tree-item',
  view: canStache(template),
  leakScope: true,
  viewModel,
  events: {
    inserted: function () {
      this.viewModel.attr('$el', this.element);
    },
    '{viewModel.instance} destroyed'() {
      const element = $(this.element)
        .closest('tree-widget-container');
      trigger.call(element[0], 'refreshTree');
    },
  },
});
