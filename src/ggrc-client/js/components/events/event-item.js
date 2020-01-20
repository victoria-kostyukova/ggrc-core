/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './event-item.stache';

export default canComponent.extend({
  tag: 'event-item',
  view: canStache(template),
  viewModel: canMap.extend({
    define: {
      hasHiddenRevisions: {
        get() {
          return this.attr('event.revisions_count') > 100;
        },
      },
      hiddenRevisionsCount: {
        get() {
          return this.attr('event.revisions_count') - 100;
        },
      },
    },
    event: null,
  }),
});
