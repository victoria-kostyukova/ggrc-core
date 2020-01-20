/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canMap from 'can-map';
import canComponent from 'can-component';
const ALL_SAVED_TEXT = 'All changes saved';
const UNSAVED_TEXT = 'Unsaved changes';
const IS_SAVING_TEXT = 'Saving...';

export default canComponent.extend({
  tag: 'custom-attributes-status',
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      isDirty: {
        type: 'boolean',
        value: false,
      },
      formSaving: {
        type: 'boolean',
        value: false,
      },
      formStatusText: {
        type: 'string',
        get: function () {
          if (this.attr('formSaving')) {
            return IS_SAVING_TEXT;
          }
          return !this.attr('isDirty') ? ALL_SAVED_TEXT : UNSAVED_TEXT;
        },
      },
    },
  }),
});
