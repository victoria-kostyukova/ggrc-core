/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loFind from 'lodash/find';
import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import template from './templates/repeat-on-summary.stache';
import {unitOptions as workflowUnitOptions} from '../../apps/workflow-config';

const ViewModel = canDefineMap.extend({
  unit: {
    value: null,
  },
  repeatEvery: {
    value: null,
  },
  hideRepeatOff: {
    type: 'boolean',
    value: true,
  },
  unitText: {
    get() {
      let result = '';
      let repeatEvery = this.repeatEvery;
      let unit = loFind(workflowUnitOptions, (option) => {
        return option.value === this.unit;
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
});

export default canComponent.extend({
  tag: 'repeat-on-summary',
  view: canStache(template),
  leakScope: true,
  ViewModel,
});
