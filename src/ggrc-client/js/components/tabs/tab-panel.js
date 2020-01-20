/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import '../lazy-render/lazy-render';
import template from './tab-panel.stache';

const PRE_RENDER_DELAY = 3000;

export default canComponent.extend({
  tag: 'tab-panel',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      cssClasses: {
        type: 'string',
        get: function () {
          return this.attr('active') ? 'active' : 'hidden';
        },
      },
      cacheContent: {
        type: 'boolean',
        value: false,
      },
      preRenderContent: {
        type: 'boolean',
        value: false,
      },
      isLazyRender: {
        type: 'boolean',
        get: function () {
          return this.attr('cacheContent') || this.attr('preRenderContent');
        },
      },
      lazyTrigger: {
        type: 'boolean',
        get: function () {
          return this.attr('active') || this.attr('preRender');
        },
      },
      parentInstance: {
        value: {},
      },
    },
    tabType: 'panel',
    active: false,
    titleText: '',
    tabId: '',
    panels: [],
    tabIndex: null,
    canDisplayWarning: false,
    warningState: false,
    warningText: '',
    extraClasses: '',
    addPanel: function () {
      let panels = this.attr('panels');
      let isAlreadyAdded = panels.indexOf(this) > -1;
      if (isAlreadyAdded) {
        return;
      }
      this.attr('tabIndex', panels.length + 1);
      panels.push(this);
      panels.dispatch('panelAdded');
    },
    removePanel: function () {
      let itemTabIndex = this.attr('tabIndex');
      let panels = this.attr('panels');
      let indexToRemove;

      panels.each(function (panel, index) {
        if (panel.attr('tabIndex') === itemTabIndex) {
          indexToRemove = index;
          return false;
        }
      });
      if (indexToRemove > -1) {
        panels.splice(indexToRemove, 1);
        panels.dispatch('panelRemoved');
      }
    },
    updateWarningState(event) {
      this.attr('warningState', event.warning);
    },
  }),
  events: {
    /**
     * On Components rendering finished add this viewModel to `panels` list
     */
    init: function () {
      let vm = this.viewModel;
      vm.addPanel();

      if (vm.attr('preRenderContent')) {
        setTimeout(() => vm.attr('preRender', true), PRE_RENDER_DELAY);
      }
    },
    removed: function () {
      this.viewModel.removePanel();
    },
  },
});
