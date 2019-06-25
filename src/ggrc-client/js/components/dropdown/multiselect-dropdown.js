/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loEvery from 'lodash/every';
import loFilter from 'lodash/filter';
import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './templates/multiselect-dropdown.stache';

export default canComponent.extend({
  tag: 'multiselect-dropdown',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    disabled: false,
    isHighlightable: true,
    isInlineMode: false,
    isOpen: false,
    _stateWasUpdated: false,
    selected: [],
    options: [],
    placeholder: '',
    define: {
      _displayValue: {
        get: function () {
          return this.attr('selected').map(function (item) {
            return item.attr('value');
          }).join(', ');
        },
      },
      _inputSize: {
        type: Number,
        get: function () {
          return this.attr('_displayValue').length;
        },
      },
      _selectedAll: {
        type: 'boolean',
        value: false,
        get: function () {
          let options = this.attr('options');

          return loEvery(options, function (item) {
            return item.attr('checked');
          });
        },
      },
      isOpenOrInline: {
        get() {
          return this.attr('isOpen') || this.attr('isInlineMode');
        },
      },
      isHighlighted: {
        get() {
          return this.attr('isHighlightable') && this.attr('isOpen');
        },
      },
      options: {
        value: [],
        set: function (value, setValue) {
          setValue(value);

          this.attr('selected', loFilter(value,
            (item) => item.checked));
        },
      },
    },
    selectAll: function () {
      let options = this.attr('options');
      let value = !this.attr('_selectedAll');

      options.forEach(function (option) {
        option.attr('checked', value);
      });

      this.updateSelected();
    },
    updateSelected: function () {
      this.attr('_stateWasUpdated', true);

      this.attr('selected', loFilter(this.attr('options'),
        (item) => item.checked));

      this.dispatch({
        type: 'selectedChanged',
        selected: this.attr('selected'),
      });
    },
    dropdownClosed: function () {
      // don't trigger event if state didn't change
      if (!this.attr('_stateWasUpdated')) {
        return;
      }

      let selected = this.attr('selected');

      this.attr('_stateWasUpdated', false);

      this.dispatch({
        type: 'dropdownClose',
        selected: selected,
      });
    },
    changeOpenCloseState: function () {
      if (!this.attr('isOpen')) {
        if (this.attr('canBeOpen')) {
          this.attr('canBeOpen', false);
          this.attr('isOpen', true);
        }
      } else {
        this.attr('isOpen', false);
        this.attr('canBeOpen', false);
        this.dropdownClosed();
      }
    },
    openDropdown: function () {
      if (this.attr('disabled')) {
        return;
      }

      // this attr needed when page has any components
      this.attr('canBeOpen', true);
    },
    optionChange: function (item) {
      // click event triggered before new value of input is saved
      item.attr('checked', !item.checked);

      this.updateSelected();
    },
    dropdownBodyClick: function (ev) {
      ev.stopPropagation();
    },
  }),
  events: {
    '{window} click': function () {
      if (this.viewModel.attr('disabled')) {
        return;
      }
      this.viewModel.changeOpenCloseState();
    },
  },
});
