/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loIsString from 'lodash/isString';
import loFilter from 'lodash/filter';
import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './templates/dropdown-wrap-text.stache';
import {isInnerClick} from '../../plugins/ggrc_utils';

const DefaultNoValueLabel = '--';

export default canComponent.extend({
  tag: 'dropdown-wrap-text',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    /*
      Options list should be an `array` of object containing `title` and `value`
      [{
        title: `title`
        value: `value`
      }]
    */
    optionsList: [],
    noValue: '',
    noValueLabel: '',
    controlId: '',
    tabIndex: 0,
    isDisabled: false,
    selected: null,
    value: null,
    isOpen: false,
    $input: null,
    $body: null,
    define: {
      options: {
        get: function () {
          const optionsList = this.attr('optionsList') || [];
          const filteredMapPredicate = (option) => loIsString(option) ?
            {
              value: option,
              title: option,
            } :
            option;

          const list = _.filteredMap(optionsList, filteredMapPredicate);

          if (!this.attr('noValue')) {
            return list;
          }

          const noneValue = this.attr('noValueLabel') || DefaultNoValueLabel;
          const noneValueOption = {
            title: noneValue,
            value: '',
          };

          return [noneValueOption].concat(list);
        },
      },
    },
    setSelectedByValue(value) {
      const options = this.attr('options');
      if (!options.length) {
        return;
      }

      // get first filtered option
      const option = loFilter(options, (opt) => opt.value === value)[0];

      if (option) {
        this.attr('selected', option);
      } else {
        this.attr('selected', options[0]);
      }
    },
    onSelectOption(option) {
      if (!this.isSelectedOption(option)) {
        this.attr('selected', option);
        this.attr('value', option.value);
      }

      this.closeDropdown();
    },
    onInputClick() {
      if (this.attr('isDisabled')) {
        return;
      }

      // toggle open/close
      this.attr('isOpen', !this.attr('isOpen'));
    },
    closeDropdown() {
      this.attr('isOpen', false);
    },
    isSelectedOption(option) {
      return option.value === this.attr('selected.value');
    },
  }),
  events: {
    inserted() {
      const vm = this.viewModel;
      const $input = this.element.find('.dropdown-wrap-text__input')[0];
      const $body = this.element.find('.dropdown-wrap-text__body')[0];

      vm.setSelectedByValue(vm.attr('value'));
      vm.attr('$input', $input);
      vm.attr('$body', $body);
    },
    '{window} click'(el, ev) {
      const vm = this.viewModel;
      if (vm.attr('isDisabled')) {
        return;
      }

      const isInputClick = isInnerClick(vm.attr('$input'), ev.target);
      const isBodyClick = isInnerClick(vm.attr('$body'), ev.target);

      if (!isBodyClick && !isInputClick) {
        // close dropdown
        this.viewModel.closeDropdown();
      }
    },
  },
});
