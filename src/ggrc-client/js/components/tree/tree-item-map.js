/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './templates/tree-item-map.stache';
import {trigger} from 'can-event';

let viewModel = canMap.extend({
  define: {
    title: {
      type: String,
      value: 'Map to this Object',
    },
    model: {
      type: '*',
      get: function () {
        return this.attr('instance.model');
      },
    },
  },
  instance: null,
  cssClasses: null,
  disableLink: false,
});

export default canComponent.extend({
  tag: 'tree-item-map',
  view: canStache(template),
  leakScope: true,
  viewModel,
  events: {
    'a click': function (el, ev) {
      let viewModel = this.viewModel;
      let instance = viewModel.attr('instance');

      if (!viewModel.attr('disableLink')) {
        if (instance.attr('type') === 'Assessment') {
          el.data('type', instance.attr('assessment_type'));
        }
        import(
          /* webpackChunkName: "mapper" */
          '../../controllers/mapper/mapper'
        ).then(() => {
          trigger.call(el[0], 'openMapper', ev);
        });
      }

      viewModel.attr('disableLink', true);

      // prevent open of two mappers
      setTimeout(function () {
        viewModel.attr('disableLink', false);
      }, 300);

      ev.preventDefault();
      return false;
    },
  },
});
