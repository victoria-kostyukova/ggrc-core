/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canMap from 'can-map';
import canComponent from 'can-component';
import {confirm} from '../plugins/utils/modals';

export default canComponent.extend({
  tag: 'reminder-component',
  leakScope: true,
  viewModel: canMap.extend({
    instance: null,
    type: '',
    modal_title: '',
    modal_description: '',

    /**
     * Create reminder notifications for all assessors of an Assessment.
     *
     * @param {canMap} viewModel - the component's viewModel
     * @param {jQuery.Object} $el - the DOM element that triggered the action
     * @param {jQuery.Event} ev - the event object
     */
    reminder: function (viewModel, $el, ev) {
      let instance = viewModel.instance;

      instance
        .refresh()
        .then(function () {
          instance.attr('reminderType', viewModel.type);
          return $.when(instance.save());
        })
        .then(function () {
          confirm({
            modal_title: viewModel.attr('modal_title'),
            modal_description: viewModel.attr('modal_description'),
            button_view: '/modals/close-buttons.stache',
          });
        });
    },
  }),
});
