/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import template from './object-selection-item.stache';
import {trigger} from 'can-event';

const ViewModel = canDefineMap.extend({
  isSaving: {
    value: false,
  },
  item: {
    value: null,
  },
  isDisabled: {
    value: false,
  },
  isSelected: {
    value: false,
  },
  isBlocked: {
    value: false,
  },
  toggleSelection(el, isSelected) {
    let event = isSelected ? 'selectItem' : 'deselectItem';
    trigger.call(el[0], event, [this.item]);
  },
});

export default canComponent.extend({
  tag: 'object-selection-item',
  view: canStache(template),
  leakScope: true,
  ViewModel,
  events: {
    'input[type="checkbox"] click'(el, ev) {
      let isSelected = el[0].checked;
      ev.preventDefault();
      ev.stopPropagation();
      this.viewModel
        .toggleSelection(this.element, isSelected);
    },
  },
});
