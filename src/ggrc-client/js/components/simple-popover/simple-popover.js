/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import template from './simple-popover.stache';

const ViewModel = canDefineMap.extend({
  element: {
    value: null,
  },
  extraCssClass: {
    value: '',
  },
  placement: {
    value: '',
  },
  buttonText: {
    value: '',
  },
  open: {
    value: false,
  },
  show() {
    this.open = true;
    document.addEventListener('mousedown', this);
  },
  hide() {
    this.open = false;
    document.removeEventListener('mousedown', this);
  },
  toggle() {
    this.open ? this.hide() : this.show();
  },
  handleEvent(event) {
    if (this.element && !this.element.contains(event.target)) {
      this.hide();
    }
  },
});

export default canComponent.extend({
  tag: 'simple-popover',
  view: canStache(template),
  init(el) {
    this.viewModel.element = el;
  },
  leakScope: true,
  ViewModel,
  events: {
    removed: function () {
      document.removeEventListener('mousedown', this.viewModel);
    },
  },
});
