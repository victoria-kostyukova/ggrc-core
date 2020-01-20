/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import canComponent from 'can-component';
import canStache from 'can-stache';
import template from './assessment-notifications.stache';
import {splitTrim} from '../../plugins/ggrc-utils';

export default canComponent.extend({
  tag: 'assessment-notifications',
  view: canStache(template),
  leakScope: false,
  viewModel: canMap.extend({
    instance: {},
    values: {},
    sendByDefault: false,
    init: function () {
      const recipients = this.instance.recipients || '';
      const recipientsArray = splitTrim(recipients);
      const values = {};
      recipientsArray.forEach((el) => values[el] = true);
      this.attr('values', values);
    },
  }),
  events: {
    '{viewModel.values} change'() {
      const values = this.viewModel.attr('values').serialize();
      const recipients = Object.keys(values)
        .filter((key) => this.viewModel.values[key])
        .join(',');
      this.viewModel.instance.attr('recipients', recipients);
    },
  },
});
