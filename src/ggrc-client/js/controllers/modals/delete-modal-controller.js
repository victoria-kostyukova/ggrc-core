/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import ModalsController from './modals-controller';
import pubSub from '../../pub-sub';
import {bindXHRToButton} from '../../plugins/utils/modals';
import {notifierXHR} from '../../plugins/utils/notifiers-utils';

export default ModalsController.extend({
  defaults: {
    skip_refresh: true,
  },
}, {
  init: function () {
    this._super();
  },
  '{$footer} a.btn[data-toggle=delete]:not(:disabled) click'(el) {
    // Disable the cancel button.
    let cancelButton = this.element.find('a[data-dismiss=modal]');
    let modalBackdrop = this.element.data('modal_form').$backdrop;

    const promise = new Promise((resolve, reject) => {
      this.options.instance.refresh()
        .then(resolve)
        .catch(reject);
    });

    bindXHRToButton(
      promise
        .then((instance) => instance.destroy())
        .then((instance) => {
          // If this modal is spawned from an edit modal, make sure that one does
          // not refresh the instance post-delete.
          let parentController = $(this.options.$trigger)
            .closest('.modal').control();
          let msg;
          if (parentController) {
            parentController.options.skip_refresh = true;
          }

          msg = instance.display_name() + ' deleted successfully';
          $(document.body).trigger('ajax:flash', {success: msg});
          if (this.element) {
            this.element.trigger('modal:success', this.options.instance);
          }

          pubSub.dispatch({
            type: 'objectDeleted',
            instance,
          });

          return new Promise(() => {}); // on success, just let the modal be destroyed or navigation happen.
          // Do not re-enable the form elements.
        }).catch((xhr) => {
          notifierXHR('error', xhr);
        }),
      el.add(cancelButton).add(modalBackdrop)
    );
  },
});
