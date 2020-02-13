/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loFind from 'lodash/find';
import loFindIndex from 'lodash/findIndex';
import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import template from './templates/multiselect-dropdown.stache';

const ESCAPE_KEY = 'Escape';
const ENTER_KEY = 'Enter';
const ARROW_UP_KEY = 'ArrowUp';
const ARROW_DOWN_KEY = 'ArrowDown';
const USER_INPUT_REG_EXP =
  new RegExp(/^[a-zA-Z0-9 {}()<>,.:;!?"'`~@#$%^&*\-_+=/|\\]$/);
const USER_INPUT_WAIT_TIME = 500;

const ViewModel = canDefineMap.extend({
  canBeOpen: {
    value: false,
  },
  disabled: {
    value: false,
  },
  isHighlightable: {
    value: true,
  },
  isInlineMode: {
    value: false,
  },
  isOpen: {
    value: false,
  },
  _stateWasUpdated: {
    value: false,
  },
  selected: {
    value: () => [],
  },
  visibleOptions: {
    value: () => [],
  },
  placeholder: {
    value: '',
  },
  userInput: {
    value: '',
  },
  timeoutId: {
    value: null,
  },
  _displayValue: {
    get() {
      return this.selected.map((item) => item.value).join(', ');
    },
  },
  _inputSize: {
    get() {
      return this._displayValue && this._displayValue.length;
    },
  },
  isOpenOrInline: {
    get() {
      return this.isOpen || this.isInlineMode;
    },
  },
  isHighlighted: {
    get() {
      return this.isHighlightable && this.isOpen;
    },
  },

  /**
   * @description The following describes the properties of an array element
   * @type {Object}
   * @property {string} value - Option value.
   * @property {string} checked - Checked option state.
   */
  options: {
    value: () => [],
    set(value, setValue) {
      setValue(value);

      this.selected = value.filter((item) => item.checked);
    },
  },
  setVisibleOptions() {
    const notHighlightedOptions = this.options.serialize()
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

    this.visibleOptions = visibleOptions;
  },
  isAllSelected() {
    return this.selected.length === this.options.length;
  },
  getHighlightedOptionIndex() {
    return loFindIndex(this.visibleOptions, (item) => item.highlighted);
  },
  updateSelected() {
    this._stateWasUpdated = true;

    const selectedOptions = this.visibleOptions.filter((option) =>
      !option.isSelectAll && option.checked);
    this.selected = selectedOptions;

    this.dispatch({
      type: 'selectedChanged',
      selected: this.selected,
    });
  },
  dropdownClosed() {
    this.removeHighlight();

    // don't trigger event if state didn't change
    if (!this._stateWasUpdated) {
      return;
    }

    this._stateWasUpdated = false;

    this.dispatch({
      type: 'dropdownClose',
      selected: this.selected,
    });
  },
  changeOpenCloseState() {
    if (!this.isOpen) {
      if (this.canBeOpen) {
        this.canBeOpen = false;
        this.isOpen = true;
      }
    } else {
      this.isOpen = false;
      this.canBeOpen = false;
      this.dropdownClosed();
    }
  },
  openDropdown() {
    if (this.disabled) {
      return;
    }

    // this attr needed when page has any components
    this.canBeOpen = true;
  },
  selectAll() {
    this.visibleOptions.forEach((option) => {
      option.checked = true;
    });
  },
  unselectAll() {
    this.visibleOptions.forEach((option) => {
      option.checked = false;
    });
  },
  selectAllOptionChange(item) {
    if (!item.checked) {
      this.selectAll();
    } else {
      this.unselectAll();
    }

    this.updateSelected();
  },
  optionChange(item) {
    // click event triggered before new value of input is saved
    item.checked = !item.checked;
    this.updateSelected();

    const selectAllOption = loFind(this.visibleOptions,
      (item) => item.isSelectAll
    );
    selectAllOption.checked = this.isAllSelected();
  },
  visibleOptionChange(item) {
    if (!item.highlighted) {
      this.chooseOption(item);
    }

    if (item.isSelectAll) {
      this.selectAllOptionChange(item);
    } else {
      this.optionChange(item);
    }
  },
  selectOption() {
    const index = this.getHighlightedOptionIndex();

    if (index !== -1) {
      this.visibleOptionChange(this.visibleOptions[index]);
    }
  },
  highlightNext() {
    const visibleOptions = this.visibleOptions;
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
      const previousOption = this.visibleOptions[previousOptionIndex];
      this.chooseOption(previousOption);
    }
  },
  processUserInput(character) {
    clearTimeout(this.timeoutId);

    this.timeoutId = setTimeout(() => {
      this.userInput = '';
    }, USER_INPUT_WAIT_TIME);

    const userInput = this.userInput + character.toLowerCase();

    this.userInput = userInput;

    const foundOption = loFind(this.visibleOptions, (option) =>
      option.value.toLowerCase().startsWith(userInput) && !option.isSelectAll
    );

    if (foundOption) {
      this.chooseOption(foundOption);
    }
  },
  highlightOption(option) {
    option.highlighted = true;
  },
  removeHighlight() {
    this.visibleOptions.forEach((option) => {
      option.highlighted = false;
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
});

export default canComponent.extend({
  tag: 'multiselect-dropdown',
  view: canStache(template),
  leakScope: true,
  ViewModel,
  events: {
    inserted() {
      this.viewModel.setVisibleOptions();
    },
    '{viewModel} options'() {
      this.viewModel.setVisibleOptions();
    },
    '{window} click'() {
      if (this.viewModel.disabled) {
        return;
      }

      this.viewModel.changeOpenCloseState();
    },
    'keyup'(el, ev) {
      if (!this.viewModel.isOpenOrInline) {
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
      if (!this.viewModel.isOpenOrInline) {
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
      const option = loFind(this.viewModel.visibleOptions, (option) =>
        option.value.toLowerCase() === searchValue
      );

      if (option) {
        this.viewModel.removeHighlight();
        this.viewModel.highlightOption(option);
      }
    },
  },
});
