/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
export default canComponent.extend({
  tag: 'unarchive-link',
  view: canStache('<a on:el:click="unarchive(scope.event)" ' +
    'href="javascript:void(0)"><content></content></a>'),
  leakScope: true,
  viewModel: canMap.extend({
    notify: '',
    instance: null,
    notifyText: 'was unarchived successfully',
    unarchive(event) {
      const instance = this.attr('instance');
      const notifyText = instance.display_name() + ' ' +
        this.attr('notifyText');

      event.preventDefault();

      if (instance && instance.attr('archived')) {
        instance.attr('archived', false);
        instance.save()
          .then(() => {
            if (this.attr('notify')) {
              $('body').trigger('ajax:flash', {success: notifyText});
            }
          });
      }
    },
  }),
});
