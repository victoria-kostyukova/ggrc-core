/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {bindXHRToButton} from '../../plugins/utils/modals';
import ModalsController from './modals-controller';

export default ModalsController.extend({
  defaults: {
    skip_refresh: false,
  },
}, {
  init: function () {
    this._super();
  },
  'a.btn[data-toggle=archive]:not(:disabled) click': function (el) {
    // Disable the cancel button.
    let cancelButton = this.element.find('a.btn[data-dismiss=modal]');
    let modalBackdrop = this.element.data('modal_form').$backdrop;
    const dfd = this.options.instance.refresh();
    bindXHRToButton(
      this.notifyArchivingResult(dfd),
      el.add(cancelButton).add(modalBackdrop)
    );
  },
  notifyArchivingResult(dfd) {
    return dfd
      .then(() => this.archive())
      .then(() => this.displaySuccessNotify())
      .fail((xhr, status) => {
        this.displayErrorNotify(xhr, status);
      });
  },
  archive() {
    let instance = this.options.instance;
    instance.attr('archived', true);
    return this.options.instance.save();
  },
  displaySuccessNotify() {
    const instance = this.options.instance;
    const msg = `${instance.display_name()} archived successfully`;
    $(document.body).trigger('ajax:flash', {success: msg});
    if (this.element) {
      this.element.trigger('modal:success', instance);
    }
  },
  displayErrorNotify(xhr) {
    $(document.body).trigger('ajax:flash', {error: xhr.responseText});
  },
});
