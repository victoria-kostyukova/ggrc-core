/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canMap from 'can-map';
import canComponent from 'can-component';
import {isAllowedFor} from '../../permission';
import '../inline/inline-form-control';
import '../inline/inline-edit-control';

export default canComponent.extend({
  tag: 'info-pane',
  leakScope: true,
  viewModel: canMap.extend({
    instance: null,
    define: {
      isInfoPaneReadonly: {
        get() {
          return !isAllowedFor('update', this.attr('instance'))
            || this.attr('instance.isRevision');
        },
      },
    },
  }),
});
