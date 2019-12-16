/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/
import canComponent from 'can-component';
import canMap from 'can-map';

const viewModel = canMap.extend({
  define: {
    uiArray: {
      type: '*',
      value: [],
    },
  },
  element: null,
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
});

const events = {
  inserted(element) {
    const viewModel = this.viewModel;
    viewModel.attr('element', $(element));
    viewModel.initUiArray();
  },
};

export default canComponent.extend({
  tag: 'modal-container',
  leakScope: true,
  viewModel,
  events,
});
