/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {splitTrim} from '../../plugins/ggrc_utils';
import loIdentity from 'lodash/identity';
import loKeys from 'lodash/keys';
import loPickBy from 'lodash/pickBy';
import loIsString from 'lodash/isString';
import loForEach from 'lodash/forEach';
import canMap from 'can-map';
import canComponent from 'can-component';
export default canComponent.extend({
  tag: 'checkbox-to-list',
  leakScope: true,
  viewModel: canMap.extend({
    property: '',
    instance: null,
    values: {},
  }),
  init: function () {
    let viewModel = this.viewModel;
    let values = viewModel.attr('instance.' + viewModel.attr('property'));

    if (values && loIsString(values)) {
      loForEach(splitTrim(values, ','), function (val) {
        if (val) {
          viewModel.attr('values.' + val, true);
        }
      });
    }
  },
  events: {
    '{viewModel.values} change': function () {
      let viewModel = this.viewModel;
      let values = loKeys(
        loPickBy(
          viewModel.attr('values').serialize(),
          loIdentity
        )
      );
      viewModel.instance.attr(viewModel.attr('property'), values.join(','));
    },
  },
});
