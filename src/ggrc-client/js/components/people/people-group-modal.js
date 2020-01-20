/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import '../person/person-data';
import template from './templates/people-group-modal.stache';

export default canComponent.extend({
  tag: 'people-group-modal',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      selectedCount: {
        get: function () {
          return `${this
            .attr('people.length')} ${this.attr('title')} Selected`;
        },
      },
    },
    modalState: {
      open: true,
    },
    isLoading: false,
    emptyListMessage: '',
    title: '',
    people: [],
    cancel() {
      this.attr('modalState.open', false);
      this.dispatch('cancel');
    },
    save() {
      this.attr('modalState.open', false);
      this.dispatch('save');
    },
  }),
});
