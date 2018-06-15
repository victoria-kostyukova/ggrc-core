/*
 Copyright (C) 2018 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import '../person/person-data';
import template from './templates/people-list.mustache';

const tag = 'people-list';

export default can.Component.extend({
  template,
  tag,
  viewModel: {
    define: {
      isEmptyList: {
        get() {
          return !this.attr('people.length');
        },
      },
    },
    people: [],
    emptyMessage: '',
    isDisabled: false,
  },
});
