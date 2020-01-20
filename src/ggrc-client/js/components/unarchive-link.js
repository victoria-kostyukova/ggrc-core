/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
export default canComponent.extend({
  tag: 'unarchive-link',
  view: canStache('<a href="javascript:void(0)"><content></content></a>'),
  leakScope: true,
  viewModel: canMap.extend({
    notify: '',
    instance: null,
    notifyText: 'was unarchived successfully',
  }),
  events: {
    'a click': function (el, event) {
      let instance = this.viewModel.attr('instance');
      let notifyText = instance.display_name() + ' ' +
        this.viewModel.attr('notifyText');

      event.preventDefault();

      if (instance && instance.attr('archived')) {
        instance.attr('archived', false);
        instance.save()
          .then(function () {
            if (this.viewModel.attr('notify')) {
              $('body').trigger('ajax:flash', {success: notifyText});
            }
          }.bind(this));
      }
    },
  },
});
