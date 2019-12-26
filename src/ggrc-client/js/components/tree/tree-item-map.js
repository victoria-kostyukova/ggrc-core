/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import template from './templates/tree-item-map.stache';
import {trigger} from 'can-event';

const ViewModel = canDefineMap.extend({
  instance: {
    value: null,
  },
  cssClasses: {
    value: null,
  },
  disableLink: {
    value: false,
  },
  title: {
    type: 'string',
    value: 'Map to this Object',
  },
  model: {
    get() {
      return this.instance.attr('model');
    },
  },
});

export default canComponent.extend({
  tag: 'tree-item-map',
  view: canStache(template),
  leakScope: true,
  ViewModel,
  events: {
    'a click'(el, ev) {
      let viewModel = this.viewModel;
      let instance = viewModel.instance;

      if (!viewModel.disableLink) {
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

      viewModel.disableLink = true;

      // prevent open of two mappers
      setTimeout(() => {
        viewModel.disableLink = false;
      }, 300);

      ev.preventDefault();
      return false;
    },
  },
});
