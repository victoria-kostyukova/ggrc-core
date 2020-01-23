/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import '../../components/gca-controls/gca-controls';
import canComponent from 'can-component';
import canMap from 'can-map';
import canStache from 'can-stache';
import template from './modal-container.stache';
import {
  setModalState,
  getModalState,
} from '../../plugins/utils/display-prefs-utils';

const viewModel = canMap.extend({
  define: {
    uiArray: {
      type: '*',
      value: [],
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
    showCustomAttributes: {
      get() {
        return this.attr('instance').constructor.is_custom_attributable;
      },
    },
    isModalSaving: {
      set(isSaving) {
        // trigger saving states of hidable sections each time when
        // modal is saving (from modals-controller)
        if (isSaving) {
          this.saveUiStatus();
        }

        return isSaving;
      },
    },
  },
  element: null,
  resetVisible: false,
  model: null,
  initUiArray() {
    // Update UI status array
    let $form = this.attr('element').find('form');
    let tabList = $form.find('[tabindex]');
    let hidableTabs = 0;
    for (let i = 0; i < tabList.length; i++) {
      if ($(tabList[i]).attr('tabindex') > 0) {
        hidableTabs++;
      }
    }
    // Add extra space for skipped numbers
    let storableUI = hidableTabs + 20;
    for (let i = 0; i < storableUI; i++) {
      // When we start, all the ui elements are visible
      this.attr('uiArray').push(0);
    }
  },
  saveUiStatus() {
    let modelName = this.attr('model').model_singular;
    let resetVisible = this.attr('resetVisible') ?
      this.attr('resetVisible') : false;
    let uiArray = this.attr('uiArray') || [];
    let displayState = {
      reset_visible: resetVisible,
      ui_array: uiArray,
    };

    setModalState(modelName, displayState);
  },
  restoreUiStatusFromStorage() {
    const model = this.attr('model');

    if (!model) {
      return;
    }
    let modelName = model.model_singular;
    let displayState = getModalState(modelName);

    // set up reset_visible and ui_array
    if (displayState !== null) {
      if (displayState.reset_visible) {
        this.attr('resetVisible', displayState.reset_visible);
      }
      if (displayState.ui_array) {
        this.attr('uiArray', displayState.ui_array.slice());
      }
    }
    this.restoreUiStatus();
  },
  restoreUiStatus() {
    let $selected;
    let str;
    let tabindex;
    let i;
    let $form;
    let $body;

    // walk through the uiArray, for the one values,
    // select the element with tab index and hide it

    if (this.attr('resetVisible')) {// some elements are hidden
      $form = this.attr('element').find('form');
      $body = $form.closest('.modal-body');
      const uiArray = this.attr('uiArray');

      for (i = 0; i < uiArray.length; i++) {
        if (uiArray[i] === 1) {
          tabindex = i + 1;
          str = '[tabindex=' + tabindex + ']';
          $selected = $body.find(str);

          if ($selected) {
            $selected.closest('.hidable').addClass('hidden');
            $selected.attr({
              uiindex: tabindex,
              tabindex: '-1',
            });
          }
        }
      }
    }
  },
});

const events = {
  inserted(element) {
    const viewModel = this.viewModel;
    viewModel.attr('element', $(element));
    viewModel.initUiArray();
    viewModel.restoreUiStatusFromStorage();
  },
  'a.field-hide click'(el, ev) { // field hide
    const viewModel = this.viewModel;
    let $el = $(el);
    let totalInner = $el.closest('.hide-wrap.hidable')
      .find('.inner-hide').length;
    let totalHidden;
    let uiUnit;
    let i;
    let tabValue;
    let $hidable = [
      'span',
      'ggrc-form-item',
    ].map((className) => $el.closest(`[class*="${className}"].hidable`))
      .find((item) => item.length > 0);

    $el.closest('.inner-hide').addClass('inner-hidable');
    totalHidden = $el.closest('.hide-wrap.hidable')
      .find('.inner-hidable').length;

    $hidable.addClass('hidden');

    viewModel.attr('resetVisible', true);

    // update ui array
    const uiArray = viewModel.attr('uiArray');
    uiUnit = $hidable.find('[tabindex]');
    for (i = 0; i < uiUnit.length; i++) {
      tabValue = $(uiUnit[i]).attr('tabindex');
      if (tabValue > 0) {
        uiArray[tabValue - 1] = 1;
        $(uiUnit[i]).attr('tabindex', '-1');
        $(uiUnit[i]).attr('uiindex', tabValue);
      }
    }

    if (totalInner === totalHidden) {
      $el.closest('.inner-hide').parent('.hidable').addClass('hidden');
    }

    return false;
  },
  '#formHide click'() {
    const viewModel = this.viewModel;
    const uiArray = viewModel.attr('uiArray');
    const element = viewModel.attr('element');

    let i;
    let uiArrLength = uiArray.length;
    let $hidables = element.find('.hidable');
    let hiddenElements = $hidables.find('[tabindex]');
    let $hiddenElement;
    let tabValue;
    for (i = 0; i < uiArrLength; i++) {
      uiArray[i] = 0;
    }

    viewModel.attr('resetVisible', true);

    $hidables.addClass('hidden');
    element.find('.inner-hide').addClass('inner-hidable');

    // Set up the hidden elements index to 1
    for (i = 0; i < hiddenElements.length; i++) {
      $hiddenElement = $(hiddenElements[i]);
      tabValue = $hiddenElement.attr('tabindex');
      // The UI array index start from 0, and tab-index is from 1
      if (tabValue > 0) {
        uiArray[tabValue - 1] = 1;
        $hiddenElement.attr({
          tabindex: '-1',
          uiindex: tabValue,
        });
      }
    }

    return false;
  },
  '#formRestore click'() {
    const viewModel = this.viewModel;
    const uiArray = viewModel.attr('uiArray');
    const element = viewModel.attr('element');

    // Update UI status array to initial state
    let i;
    let uiArrLength = uiArray.length;
    let $form = element.find('form');
    let $body = $form.closest('.modal-body');
    let uiElements = $body.find('[uiindex]');
    let $el;
    let tabVal;

    for (i = 0; i < uiArrLength; i++) {
      uiArray[i] = 0;
    }

    // Set up the correct tab index for tabbing
    // Get all the ui elements with 'uiindex' set to original tabindex
    // Restore the original tab index

    for (i = 0; i < uiElements.length; i++) {
      $el = $(uiElements[i]);
      tabVal = $el.attr('uiindex');
      $el.attr('tabindex', tabVal);
    }

    viewModel.attr('resetVisible', false);

    element.find('.hidden').removeClass('hidden');
    element.find('.inner-hide').removeClass('inner-hidable');
    return false;
  },
};

export default canComponent.extend({
  tag: 'modal-container',
  leakScope: true,
  view: canStache(template),
  viewModel,
  events,
});
