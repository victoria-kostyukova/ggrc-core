/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loDifference from 'lodash/difference';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import * as StateUtils from '../../plugins/utils/state-utils';
import router from '../../router';
import {
  getTreeViewStates,
  setTreeViewStates,
} from '../../plugins/utils/display-prefs-utils';

const ViewModel = canDefineMap.extend({
  router: {
    value: null,
  },
  disabled: {
    value: false,
  },
  filterStates: {
    value: () => [],
  },
  widgetId: {
    value: null,
  },
  modelName: {
    value: null,
  },
  currentStates: {
    get() {
      let states = this.filterStates
        .filter((state) => state.checked)
        .map((state) => state.value);
      return states;
    },
  },
  allStates: {
    get() {
      let modelName = this.modelName;
      let states = StateUtils.getStatesForModel(modelName);
      return states;
    },
  },
  getDefaultStates() {
    let widgetId = this.widgetId;
    // Get the status list from local storage
    let savedStates = getTreeViewStates(widgetId);
    // Get the status list from query string
    let queryStates = router.attr('state');

    let modelName = this.modelName;
    let allStates = this.allStates;

    let defaultStates = (queryStates || savedStates).filter((state) => {
      return allStates.includes(state);
    });

    if (defaultStates.length === 0) {
      defaultStates = StateUtils.getDefaultStatesForModel(modelName);
    }

    return defaultStates;
  },
  saveTreeStates(selectedStates) {
    let widgetId = this.widgetId;
    setTreeViewStates(widgetId, selectedStates);
  },
  setStatesDropdown(states) {
    let statuses = this.filterStates.map((item) => {
      item.checked = (states.indexOf(item.value) > -1);

      return item;
    });

    // need to trigger change event for 'filterStates' attr
    this.filterStates = statuses;
  },
  setStatesRoute(states) {
    let allStates = this.allStates;

    if (states.length && loDifference(allStates, states).length) {
      router.attr('state', states);
    } else {
      router.removeAttr('state');
    }
  },
  buildSearchQuery(states) {
    let allStates = this.allStates;
    let modelName = this.modelName;
    let query = (states.length && loDifference(allStates, states).length) ?
      StateUtils.buildStatusFilter(states, modelName) :
      null;

    this.dispatch({
      type: 'searchQueryChanged',
      name: 'status',
      query,
    });
  },
  selectItems(event) {
    let selectedStates = event.selected.map((state) => state.value);

    this.buildSearchQuery(selectedStates);
    this.saveTreeStates(selectedStates);
    this.setStatesRoute(selectedStates);
    this.filter();
  },
  filter() {
    this.dispatch('submitFilter');
  },
});

export default canComponent.extend({
  tag: 'tree-status-filter',
  leakScope: true,
  ViewModel,
  events: {
    inserted() {
      let vm = this.viewModel;

      vm.router = router;

      // Setup key-value pair items for dropdown
      let filterStates = vm.allStates.map((state) => {
        return {
          value: state,
          checked: false,
        };
      });
      vm.filterStates = filterStates;

      let defaultStates = vm.getDefaultStates();
      vm.buildSearchQuery(defaultStates);
      vm.setStatesDropdown(defaultStates);
      vm.setStatesRoute(defaultStates);

      vm.dispatch({
        type: 'treeFilterReady',
        filterName: 'tree-status-filter',
      });
    },
    '{viewModel} disabled'() {
      if (this.viewModel.disabled) {
        this.viewModel.setStatesDropdown([]);
        this.viewModel.setStatesRoute([]);
      } else {
        let defaultStates = this.viewModel.getDefaultStates();
        this.viewModel.setStatesDropdown(defaultStates);
        this.viewModel.setStatesRoute(defaultStates);
      }
    },
    '{viewModel.router} state'([router], event, newStatuses) {
      // ignore empty "state" query param
      if (!newStatuses) {
        return;
      }

      let isCurrent = this.viewModel.widgetId === router.attr('widget');
      let isEnabled = !this.viewModel.disabled;

      let currentStates = this.viewModel.currentStates;
      let isChanged =
        loDifference(currentStates, newStatuses).length ||
        loDifference(newStatuses, currentStates).length;

      if (isCurrent && isEnabled && isChanged) {
        this.viewModel.buildSearchQuery(newStatuses);
        this.viewModel.setStatesDropdown(newStatuses);
        this.viewModel.filter();
      }
    },
    '{viewModel.router} widget'([router]) {
      let isCurrent = this.viewModel.widgetId === router.attr('widget');
      let isEnabled = !this.viewModel.disabled;
      let routeStatuses = router.attr('state');

      if (isCurrent && isEnabled && !routeStatuses) {
        let statuses = this.viewModel.currentStates;
        this.viewModel.setStatesRoute(statuses);
      }
    },
  },
});
