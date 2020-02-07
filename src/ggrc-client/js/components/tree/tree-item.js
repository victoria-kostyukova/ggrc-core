/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canComponent from 'can-component';
import '../lazy-render/lazy-render';
import '../cycle-task-actions/cycle-task-actions';
import './tree-item-attr';
import './tree-item-custom-attribute';
import BaseTreeItemVM from './tree-item-base-vm';
import template from './templates/tree-item.stache';

let ViewModel = BaseTreeItemVM.extend({
  extraClasses: {
    get() {
      let classes = [];
      let instance = this.instance;

      if (instance.snapshot) {
        classes.push('snapshot');
      }

      if (instance.workflow_state) {
        classes.push('t-' + instance.workflow_state);
      }

      if (this.expanded) {
        classes.push('open-item');
      }

      return classes.join(' ');
    },
  },
  selectableSize: {
    get() {
      let attrCount = this.selectedColumns.length;
      let result = 3;

      if (attrCount < 4) {
        result = 1;
      } else if (attrCount < 7) {
        result = 2;
      }

      return result;
    },
  },
  selectedColumns: {
    value: () => [],
  },
  mandatory: {
    value: () => [],
  },
  disableConfiguration: {
    value: null,
  },
  itemSelector: {
    value: '.tree-item-content',
  },
});

export default canComponent.extend({
  tag: 'tree-item',
  view: canStache(template),
  leakScope: true,
  ViewModel,
  events: {
    inserted() {
      this.viewModel.$el = this.element.find('.tree-item-wrapper');
    },
  },
});
