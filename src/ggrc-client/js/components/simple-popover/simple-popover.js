/*
 Copyright (C) 2018 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import template from './simple-popover.mustache';

export default can.Component.extend({
  tag: 'simple-popover',
  template: template,
  init: function (el) {
    this.viewModel.element = el;
  },
  viewModel: can.Map.extend({
    extraCssClass: '@',
    placement: '@',
    buttonText: '',
    open: false,
    show: function () {
      this.attr('open', true);
      document.addEventListener('mousedown', this);
    },
    hide: function () {
      this.attr('open', false);
      document.removeEventListener('mousedown', this);
    },
    toggle: function () {
      if (this.attr('open')) {
        this.hide();
      } else {
        this.show();
      }
    },
    handleEvent: function (event) {
      if (this.element && !this.element.contains(event.target)) {
        this.hide();
      }
    },
  }),
  events: {
    removed: function () {
      document.removeEventListener('mousedown', this.viewModel);
    },
  },
});
