/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import './repeat-on-button';

export default canComponent.extend({
  tag: 'repeat-on-button-wrapper',
  view: canStache(
    '<repeat-on-button unit:from="instance.unit"' +
    ' repeatEvery:from="instance.repeat_every"' +
    ' onSaveRepeat:from="@onSetRepeat">' +
    '</repeat-on-button>'
  ),
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      autoSave: {
        type: 'boolean',
        value: false,
      },
    },
    instance: {},
    setRepeatOn: function (unit, repeatEvery) {
      this.attr('instance.unit', unit);
      this.attr('instance.repeat_every', repeatEvery);
    },
    updateRepeatOn: function () {
      let deferred = $.Deferred();
      let instance = this.attr('instance');

      instance.save()
        .done(function () {
          $(document.body).trigger('ajax:flash', {
            success: 'Repeat updated successfully',
          });
        })
        .fail(function () {
          $(document.body).trigger('ajax:flash', {
            error: 'An error occurred',
          });
        })
        .always(function () {
          deferred.resolve();
        });

      return deferred;
    },
    onSetRepeat: function (unit, repeatEvery) {
      this.setRepeatOn(unit, repeatEvery);
      if (this.attr('autoSave')) {
        return this.updateRepeatOn();
      }

      return $.Deferred().resolve();
    },
  }),
});
