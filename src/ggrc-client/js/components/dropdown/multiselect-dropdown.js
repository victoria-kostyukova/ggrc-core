/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loFind from 'lodash/find';
import loFindIndex from 'lodash/findIndex';
import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './templates/multiselect-dropdown.stache';

const ESCAPE_KEY = 'Escape';
const ENTER_KEY = 'Enter';
const ARROW_UP_KEY = 'ArrowUp';
const ARROW_DOWN_KEY = 'ArrowDown';
const USER_INPUT_REG_EXP =
  new RegExp(/^[a-zA-Z0-9 {}()<>,.:;!?"'`~@#$%^&*\-_+=/|\\]$/);
const USER_INPUT_WAIT_TIME = 500;

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
    visibleOptions: [],
    placeholder: '',
    userInput: '',
    timeoutId: null,
    define: {
      _displayValue: {
        get() {
          return this.attr('selected').map((item) =>
            item.attr('value')).join(', ');
        },
      },
      _inputSize: {
        type: Number,
        get() {
          return this.attr('_displayValue').length;
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

      /**
       * @description The following describes the properties of an array element
       * @type {Object}
       * @property {string} value - Option value.
       * @property {string} checked - Checked option state.
       */
      options: {
        value: [],
        set(value, setValue) {
          setValue(value);

          this.attr('selected', value.filter((item) => item.checked));
        },
      },
    },
    setVisibleOptions() {
      const notHighlightedOptions = this.attr('options').serialize()
        .map((option) => ({
          ...option,
          highlighted: false,
        }));

      let visibleOptions = [{
        // additional internal option for this component
        value: 'Select All',
        checked: this.isAllSelected(),
        // 'isSelectAll' property is used to make it easy to find the 'Select All' option
        // because it must be processed differently from other options
        isSelectAll: true,
        highlighted: false,
      }, ...notHighlightedOptions];

      this.attr('visibleOptions', visibleOptions);
    },
    isAllSelected() {
      return this.attr('selected').length === this.attr('options').length;
    },
    getHighlightedOptionIndex() {
      return loFindIndex(this.attr('visibleOptions'), (item) =>
        item.attr('highlighted'));
    },
    updateSelected() {
      this.attr('_stateWasUpdated', true);

      const selectedOptions = this.attr('visibleOptions').filter((option) =>
        !option.attr('isSelectAll') && option.attr('checked'));
      this.attr('selected', selectedOptions);

      this.dispatch({
        type: 'selectedChanged',
        selected: this.attr('selected'),
      });
    },
    dropdownClosed() {
      this.removeHighlight();

      // don't trigger event if state didn't change
      if (!this.attr('_stateWasUpdated')) {
        return;
      }

      this.attr('_stateWasUpdated', false);

      this.dispatch({
        type: 'dropdownClose',
        selected: this.attr('selected'),
      });
    },
    changeOpenCloseState() {
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
    openDropdown() {
      if (this.attr('disabled')) {
        return;
      }

      // this attr needed when page has any components
      this.attr('canBeOpen', true);
    },
    selectAll() {
      this.attr('visibleOptions').forEach((option) => {
        option.attr('checked', true);
      });
    },
    unselectAll() {
      this.attr('visibleOptions').forEach((option) => {
        option.attr('checked', false);
      });
    },
    selectAllOptionChange(item) {
      if (!item.attr('checked')) {
        this.selectAll();
      } else {
        this.unselectAll();
      }

      this.updateSelected();
    },
    optionChange(item) {
      // click event triggered before new value of input is saved
      item.attr('checked', !item.checked);
      this.updateSelected();

      const selectAllOption = loFind(this.attr('visibleOptions'),
        (item) => item.attr('isSelectAll'));
      selectAllOption.attr('checked', this.isAllSelected());
    },
    visibleOptionChange(item) {
      if (!item.attr('highlighted')) {
        this.chooseOption(item);
      }

      if (item.attr('isSelectAll')) {
        this.selectAllOptionChange(item);
      } else {
        this.optionChange(item);
      }
    },
    selectOption() {
      const index = this.getHighlightedOptionIndex();

      if (index !== -1) {
        this.visibleOptionChange(this.attr('visibleOptions')[index]);
      }
    },
    highlightNext() {
      const visibleOptions = this.attr('visibleOptions');
      const nextOptionIndex = this.getHighlightedOptionIndex() + 1;
      const isLastOption = (nextOptionIndex === visibleOptions.length);

      if (isLastOption) {
        return;
      }

      const nextOption = visibleOptions[nextOptionIndex];

      this.chooseOption(nextOption);
    },
    highlightPrevious() {
      const previousOptionIndex = this.getHighlightedOptionIndex() - 1;

      if (previousOptionIndex > -1) {
        const previousOption = this.attr('visibleOptions')[previousOptionIndex];
        this.chooseOption(previousOption);
      }
    },
    processUserInput(character) {
      clearTimeout(this.attr('timeoutId'));

      this.attr('timeoutId', setTimeout(() => {
        this.attr('userInput', '');
      }, USER_INPUT_WAIT_TIME));

      const userInput = this.attr('userInput') + character.toLowerCase();

      this.attr('userInput', userInput);

      const foundOption = loFind(this.attr('visibleOptions'), (option) => {
        return option.attr('value').toLowerCase().startsWith(userInput) &&
          !option.attr('isSelectAll');
      });

      if (foundOption) {
        this.chooseOption(foundOption);
      }
    },
    highlightOption(option) {
      option.attr('highlighted', true);
    },
    removeHighlight() {
      this.attr('visibleOptions').forEach((option) => {
        option.attr('highlighted', false);
      });
    },
    scrollTop(element) {
      const list = $('.multiselect-dropdown__list')[0];
      const scrollBottom = list.clientHeight + list.scrollTop;
      const elementBottom = element.offsetTop + element.offsetHeight;

      if (element.offsetTop < list.scrollTop) {
        list.scrollTop = element.offsetTop - list.offsetTop;
      } else if (elementBottom > scrollBottom) {
        list.scrollTop = elementBottom - list.clientHeight - list.offsetTop;
      }
    },
    chooseOption(item) {
      this.removeHighlight();
      this.highlightOption(item);
      const foundElement =
        loFind([...$('.multiselect-dropdown__element')], (element) =>
          element.innerText.toLowerCase() === item.value.toLowerCase());
      this.scrollTop(foundElement);
    },
    dropdownBodyClick(ev) {
      ev.stopPropagation();
    },
  }),
  events: {
    inserted() {
      this.viewModel.setVisibleOptions();
    },
    '{viewModel} options'() {
      this.viewModel.setVisibleOptions();
    },
    '{window} click'() {
      if (this.viewModel.attr('disabled')) {
        return;
      }

      this.viewModel.changeOpenCloseState();
    },
    'keyup'(el, ev) {
      if (!this.viewModel.attr('isOpenOrInline')) {
        return;
      }

      // stopPropagation is needed to stop bubbling
      // and prevent calling parent and global handlers
      if (ev.key === ENTER_KEY || ev.key === ESCAPE_KEY) {
        if (ev.key === ESCAPE_KEY) {
          this.viewModel.changeOpenCloseState();
        }
        ev.stopPropagation();
      }
    },
    '{window} keydown'(el, ev) {
      if (!this.viewModel.attr('isOpenOrInline')) {
        return;
      }

      switch (ev.key) {
        case ENTER_KEY:
          this.viewModel.selectOption();
          break;
        case ARROW_DOWN_KEY:
          this.viewModel.highlightNext();
          break;
        case ARROW_UP_KEY:
          this.viewModel.highlightPrevious();
          break;
        default:
          if (USER_INPUT_REG_EXP.test(ev.key)) {
            this.viewModel.processUserInput(ev.key);
          }
          break;
      }

      ev.preventDefault();
      ev.stopPropagation();
    },
    '.multiselect-dropdown__element mouseenter'(el, ev) {
      const searchValue = ev.currentTarget.innerText.toLowerCase();
      const option = loFind(this.viewModel.attr('visibleOptions'), (option) =>
        option.attr('value').toLowerCase() === searchValue
      );

      if (option) {
        this.viewModel.removeHighlight();
        this.viewModel.highlightOption(option);
      }
    },
  },
});
