/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import ModalsController from './modals-controller';

export default ModalsController.extend({
  defaults: {
    skip_refresh: true,
    content_view: '/gdrive/auth-button.stache',
  },
  init: function () {
    this.defaults.button_view = '/base_objects/empty.stache';
  },
}, {
  init: function () {
    this._super();
    this.element.trigger('shown');
    this.element.addClass('gapi-modal-control');
  },
  '{scopes} change': function () {
    this.element.trigger('shown');
  },
  '{$content} a.btn[data-toggle=gapi]:not(.disabled) click': function (el) {
    el.addClass('disabled');
    this.options.onAccept().always(() => {
      this.element.modal_form('hide');
    });
  },
  ' hide': function () {
    this.options.onDecline();
    this.element && this.element.remove();
  },
});
