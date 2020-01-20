/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canComponent from 'can-component';
import canStache from 'can-stache';
import '../people-autocomplete/people-autocomplete-wrapper/people-autocomplete-wrapper';
import '../people-autocomplete/people-autocomplete-results/people-autocomplete-results';
import template from './people-autocomplete-dropdown.stache';
import actionKeyable from '../view-models/action-keyable';

/**
 * Wrapper for people-autocomplete-wrapper and people-autocomplete-results
**/

export default canComponent.extend({
  tag: 'people-autocomplete-dropdown',
  view: canStache(template),
  viewModel: actionKeyable.extend({
    define: {
      showResults: {
        set(newValue) {
          if (newValue === true) {
            window.addEventListener('click', this.boundOnWindowClick);
          } else {
            window.removeEventListener('click', this.boundOnWindowClick);
          }
          return newValue;
        },
        value: false,
      },
    },
    currentValue: null,
    boundOnWindowClick: null,
    personSelected({item: person}) {
      this.dispatch({type: 'personSelected', person});
      this.attr('showResults', false);
      this.attr('currentValue', null);
    },
    onWindowClick() {
      this.attr('showResults', false);
    },
    init() {
      this.boundOnWindowClick = this.onWindowClick.bind(this);
    },
  }),
});
