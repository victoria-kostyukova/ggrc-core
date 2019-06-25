/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loFind from 'lodash/find';
import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './templates/repeat-on-summary.stache';
import {unitOptions as workflowUnitOptions} from '../../apps/workflow-config';

export default canComponent.extend({
  tag: 'repeat-on-summary',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      unitText: {
        get: function () {
          let result = '';
          let repeatEvery = this.attr('repeatEvery');
          let unit = loFind(workflowUnitOptions, (option) => {
            return option.value === this.attr('unit');
          });

          if (unit) {
            if (repeatEvery > 1) {
              result += repeatEvery + ' ' + unit.plural;
            } else {
              result += unit.singular;
            }
          }
          return result;
        },
      },
      hideRepeatOff: {
        type: 'boolean',
        value: true,
      },
    },
    unit: null,
    repeatEvery: null,
  }),
});
