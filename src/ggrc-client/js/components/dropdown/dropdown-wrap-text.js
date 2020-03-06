/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loIsString from 'lodash/isString';
import loFilter from 'lodash/filter';
import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import template from './templates/dropdown-wrap-text.stache';
import {isInnerClick, filteredMap} from '../../plugins/ggrc-utils';

const DefaultNoValueLabel = '--';

const ViewModel = canDefineMap.extend({
  /*
    Options list should be an `array` of object containing `title` and `value`
    [{
      title: `title`
      value: `value`
    }]
  */
  optionsList: {
    value: () => [],
  },
  noValue: {
    value: '',
  },
  noValueLabel: {
    value: '',
  },
  controlId: {
    value: '',
  },
  tabIndex: {
    value: 0,
  },
  isDisabled: {
    value: false,
  },
  selected: {
    value: () => ({}),
  },
  value: {
    value: null,
  },
  isOpen: {
    value: false,
  },
  $input: {
    value: null,
  },
  $body: {
    value: null,
  },
  options: {
    get() {
      const optionsList = this.optionsList || [];
      const filteredMapPredicate = (option) => loIsString(option) ?
        {
          value: option,
          title: option,
        } :
        option;

      const list = filteredMap(optionsList, filteredMapPredicate);

      if (!this.noValue) {
        return list;
      }

      const noneValue = this.noValueLabel || DefaultNoValueLabel;
      const noneValueOption = {
        title: noneValue,
        value: '',
      };

      return [noneValueOption].concat(list);
    },
  },
  setSelectedByValue(value) {
    const options = this.options;
    if (!options.length) {
      return;
    }

    // get first filtered option
    const option = loFilter(options, (opt) => opt.value === value)[0];

    if (option) {
      this.selected = option;
    } else {
      this.selected = options[0];
    }
  },
  onSelectOption(option) {
    if (!this.isSelectedOption(option)) {
      this.selected = option;
      this.value = option.value;
    }

    this.closeDropdown();
  },
  onInputClick() {
    if (this.isDisabled) {
      return;
    }

    // toggle open/close
    this.isOpen = !this.isOpen;
  },
  closeDropdown() {
    this.isOpen = false;
  },
  isSelectedOption(option) {
    return option.value === this.selected.value;
  },
});

export default canComponent.extend({
  tag: 'dropdown-wrap-text',
  view: canStache(template),
  leakScope: true,
  ViewModel,
  events: {
    inserted() {
      const vm = this.viewModel;
      const $input = this.element.find('.dropdown-wrap-text__input')[0];
      const $body = this.element.find('.dropdown-wrap-text__body')[0];

      vm.setSelectedByValue(vm.value);
      vm.$input = $input;
      vm.$body = $body;
    },
    '{window} click'(el, ev) {
      const vm = this.viewModel;
      if (vm.isDisabled) {
        return;
      }

      const isInputClick = isInnerClick(vm.$input, ev.target);
      const isBodyClick = isInnerClick(vm.$body, ev.target);

      if (!isBodyClick && !isInputClick) {
        // close dropdown
        this.viewModel.closeDropdown();
      }
    },
  },
});
