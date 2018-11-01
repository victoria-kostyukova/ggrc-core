/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import template from './autocomplete-dropdown.mustache';

export default can.Component.extend({
  tag: 'autocomplete-dropdown',
  template,
  viewModel: {
    options: [],
    filteredOptions: [],
    isDisabled: false,
    define: {
      isOpen: {
        type: 'boolean',
        value: false,
      },
    },
    initOptions: function () {
      this.attr('filteredOptions', this.attr('options'));
    },
    filterOptions: function (el) {
      let filteredOptions = _.filter(
        this.attr('options'), (item) => {
          return item.value.toLowerCase().includes(el.val().toLowerCase());
        });
      this.attr('filteredOptions', filteredOptions);
    },
    openCloseDropdown: function (ev) {
      if (!this.attr('isDisabled')) {
        this.attr('isOpen', !this.attr('isOpen'));
        this.initOptions();
      }
      ev.stopPropagation();
    },
    onFocus: function (ev) {
      ev.stopPropagation();
    },
    onChange: function (item) {
      this.attr('value', item.value);
      this.attr('isOpen', false);
    },
  },
  events: {
    '{window} click': function () {
      if (this.viewModel.attr('isOpen')) {
        this.viewModel.attr('isOpen', false);
      }
    },
  },
});
