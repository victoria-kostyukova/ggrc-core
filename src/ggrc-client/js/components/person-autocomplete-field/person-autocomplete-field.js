/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canComponent from 'can-component';
import canStache from 'can-stache';
import template from './person-autocomplete-field.stache';
import actionKeyable from '../view-models/action-keyable';

const DROPDOWN_ACTION_KEYS = ['ArrowUp', 'ArrowDown', 'Enter', 'Tab'];

/**
 * Another person autocomplete field
 **/

export default canComponent.extend({
  tag: 'person-autocomplete-field',
  view: canStache(template),
  viewModel: actionKeyable.extend({
    personEmail: '',
    personName: '',
    showResults: false,
    autocompleteEnabled: true,
    inputId: '',
    tabindex: -1,
    placeholder: '',
    personSelected({person}) {
      const {name, email} = person;
      this.attr('personEmail', email);
      this.attr('personName', name);
      this.dispatch({type: 'personSelected', person});
    },
    onKeyDown(event) {
      if (DROPDOWN_ACTION_KEYS.includes(event.code)) {
        this.onActionKey(event.keyCode);
        event.preventDefault();
      }
    },
    onKeyUp(event) {
      const inputValue = event.target.value;
      this.attr('personEmail', inputValue);
      if (!DROPDOWN_ACTION_KEYS.includes(event.code)) {
        this.attr('searchValue', inputValue);
      }
      this.dispatch({
        type: 'keyUp',
        key: event.key,
        code: event.code,
        keyCode: event.keyCode,
      });
    },
    onInputFocus() {
      // hide suggestions
      this.attr('searchValue', null);
    },
  }),
});
