/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import canComponent from 'can-component';
import canStache from 'can-stache';
import {notifierXHR} from '../../plugins/utils/notifiers-utils';
import DeferredTransaction from '../../plugins/utils/deferred-transaction-utils';

export default canComponent.extend({
  tag: 'inline-form-control',
  leakScope: true,
  view: canStache('<content/>'),
  viewModel: canMap.extend({
    deferredSave: null,
    instance: null,
    isSaving: false,
    saveInlineForm: function (args) {
      let self = this;

      if (!this.attr('deferredSave')) {
        this.buildDefaultDeferredSave();
      }

      this.attr('deferredSave').push(function () {
        self.attr('instance.' + args.propName, args.value);
      }).fail(function (instance, xhr) {
        notifierXHR('error', xhr);
      });
    },
    buildDefaultDeferredSave() {
      const defaultDeferredSave = new DeferredTransaction(
        (resolve, reject) => {
          this.attr('isSaving', true);
          this.attr('instance')
            .save()
            .done(resolve)
            .fail(reject)
            .always(() => {
              this.attr('isSaving', false);
            });
        },
        1000
      );

      this.attr('deferredSave', defaultDeferredSave);
    },
  }),
});
