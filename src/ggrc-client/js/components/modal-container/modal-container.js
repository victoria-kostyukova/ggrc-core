/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import '../../components/gca-controls/gca-controls';
import canComponent from 'can-component';
import canDefineMap from 'can-define/map/map';
import canStache from 'can-stache';
import template from './modal-container.stache';
import {
  setModalState,
  getModalState,
} from '../../plugins/utils/display-prefs-utils';

const ViewModel = canDefineMap.extend({
  uiArray: {
    Type: Array,
    value: () => [],
  },
  instance: {
    set(value, setValue) {
      setValue(value);

      // Do this asynchronously since almost each template (modal-content) contains
      // "{{#instance}}content{{/instance}}" which rerender all the content
      // including nested components when "instance" is changed. "Rerender" is
      // asynchronous operation and there is no way to determine when
      // it's finished. "restoreUiStatus" should be called when content inside
      // "{{#instance}}{{/instance}}" is fully rerendered since it should
      // manipulate with updated DOM.
      window.queueMicrotask(() => {
        this.restoreUiStatus();
      });
    },
  },
  get showCustomAttributes() {
    return this.instance.constructor.is_custom_attributable;
  },
  set isModalSaving(isSaving) {
    // trigger saving states of hidable sections each time when
    // modal is saving (from modals-controller)
    if (isSaving) {
      this.saveUiStatus();
    }

    return isSaving;
  },
  element: {
    value: null,
  },
  resetVisible: {
    value: false,
  },
  model: {
    value: null,
  },
  initUiArray() {
    // Update UI status array
    const tabList = this.element.find('form').find('[tabindex]');

    let hidableTabs = 0;
    tabList.each((index, el) => {
      if ($(el).attr('tabindex') > 0) {
        hidableTabs++;
      }
    });

    // Add extra space for skipped numbers
    // When we start, all the ui elements are visible
    const uiArray = Array(hidableTabs + 20).fill(0);
    this.uiArray.push(...uiArray);
  },
  saveUiStatus() {
    let modelName = this.model.model_singular;
    let resetVisible = this.resetVisible || false;
    let uiArray = this.uiArray || [];
    let displayState = {
      reset_visible: resetVisible,
      ui_array: uiArray,
    };

    setModalState(modelName, displayState);
  },
  restoreUiStatusFromStorage() {
    const model = this.model;

    if (!model) {
      return;
    }
    let modelName = model.model_singular;
    let displayState = getModalState(modelName);

    // set up reset_visible and ui_array
    if (displayState !== null) {
      if (displayState.reset_visible) {
        this.resetVisible = displayState.reset_visible;
      }
      if (displayState.ui_array) {
        this.uiArray = displayState.ui_array.serialize();
      }
    }
    this.restoreUiStatus();
  },
  restoreUiStatus() {
    if (!this.resetVisible) {
      return;
    }

    // walk through the uiArray, for the one values,
    // select the element with tab index and hide it
    // some elements are hidden
    const $body = this.element
      .find('form')
      .closest('.modal-body');

    this.uiArray.forEach((uiItem, index) => {
      if (uiItem !== 1) {
        return;
      }

      const uiindex = index + 1;
      const $selected = $body.find(`[tabindex=${uiindex}]`);

      $selected.closest('.hidable').addClass('hidden');
      $selected.attr({
        uiindex,
        tabindex: '-1',
      });
    });
  },
});

const events = {
  inserted(element) {
    const viewModel = this.viewModel;
    viewModel.element = $(element);
    viewModel.initUiArray();
    viewModel.restoreUiStatusFromStorage();
  },
  'a.field-hide click'(el, ev) { // field hide
    const viewModel = this.viewModel;
    const $el = $(el);
    const totalInner = $el.closest('.hide-wrap.hidable')
      .find('.inner-hide').length;
    const $hidable = [
      'span',
      'ggrc-form-item',
    ].map((className) => $el.closest(`[class*="${className}"].hidable`))
      .find((item) => item.length > 0);

    $el.closest('.inner-hide').addClass('inner-hidable');
    const totalHidden = $el.closest('.hide-wrap.hidable')
      .find('.inner-hidable').length;

    $hidable.addClass('hidden');

    viewModel.resetVisible = true;

    // update ui array
    const uiArray = viewModel.uiArray;

    $hidable.find('[tabindex]').each((index, el) => {
      const $el = $(el);
      const uiindex = $el.attr('tabindex');

      if (uiindex > 0) {
        uiArray[uiindex - 1] = 1;
        $el.attr({
          tabindex: '-1',
          uiindex,
        });
      }
    });

    if (totalInner === totalHidden) {
      $el.closest('.inner-hide').parent('.hidable').addClass('hidden');
    }

    return false;
  },
  '#formHide click'() {
    const viewModel = this.viewModel;
    const uiArray = viewModel.uiArray;
    const element = viewModel.element;
    const $hidables = element.find('.hidable');

    uiArray.fill(0);

    viewModel.resetVisible = true;

    $hidables.addClass('hidden');
    element.find('.inner-hide').addClass('inner-hidable');

    // Set up the hidden elements index to 1
    $hidables.find('[tabindex]').each((index, el) => {
      const $hiddenElement = $(el);
      const uiindex = $hiddenElement.attr('tabindex');

      // The UI array index start from 0, and tab-index is from 1
      if (uiindex > 0) {
        uiArray[uiindex - 1] = 1;
        $hiddenElement.attr({
          tabindex: '-1',
          uiindex,
        });
      }
    });

    return false;
  },
  '#formRestore click'() {
    const viewModel = this.viewModel;
    const element = viewModel.element;

    // Update UI status array to initial state
    viewModel.uiArray.fill(0);

    // Set up the correct tab index for tabbing
    // Get all the ui elements with 'uiindex' set to original tabindex
    // Restore the original tab index

    element
      .find('form')
      .closest('.modal-body')
      .find('[uiindex]')
      .each((index, el) => {
        const $el = $(el);
        $el.attr('tabindex', $el.attr('uiindex'));
      });

    viewModel.resetVisible = false;

    element.find('.hidden').removeClass('hidden');
    element.find('.inner-hide').removeClass('inner-hidable');

    return false;
  },
};

export default canComponent.extend({
  tag: 'modal-container',
  leakScope: true,
  view: canStache(template),
  ViewModel,
  events,
});
