/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import '../sortable-column/sortable-column';
import './tree-visible-column-checkbox';
import template from './templates/tree-header.stache';
import {getVisibleColumnsConfig, getSortingForModel}
  from '../../plugins/utils/tree-view-utils';

const ViewModel = canDefineMap.extend({
  model: {
    value: null,
  },
  columns: {
    value: () => ({}),
  },
  selectedColumns: {
    value: () => [],
  },
  availableColumns: {
    value: () => [],
  },
  disableConfiguration: {
    value: null,
  },
  mandatory: {
    value: () => [],
  },
  orderBy: {
    value: () => ({}),
  },
  cssClasses: {
    get() {
      let classes = [];

      if (this.isActiveActionArea()) {
        classes.push('active-action-area');
      }

      return classes.join(' ');
    },
  },
  selectableSize: {
    get() {
      let attrCount = this.selectedColumns.length;
      let result = 3;

      if (attrCount < 4) {
        result = 1;
      } else if (attrCount < 7) {
        result = 2;
      }
      return result;
    },
  },
  /**
   * Dispatches the event with names of selected columns.
   *
   * @fires updateColumns
   */
  setColumns: function () {
    const selectedNames = this.columns
      .serialize()
      .filter((item) => item.selected)
      .map((item) => item.name);

    this.dispatch({
      type: 'updateColumns',
      columns: selectedNames,
    });
  },
  onOrderChange() {
    const field = this.orderBy.field;
    const sortDirection = this.orderBy.direction;

    this.dispatch({
      type: 'sort',
      field,
      sortDirection,
    });
  },
  initializeColumns() {
    let selectedColumns = this.selectedColumns;
    let availableColumns = this.availableColumns;
    let columns;

    if (selectedColumns.length && availableColumns.length) {
      columns = getVisibleColumnsConfig(availableColumns, selectedColumns);

      this.columns = columns;
    }
  },
  isActiveActionArea() {
    let modelName = this.model.model_singular;
    return modelName === 'CycleTaskGroupObjectTask' || modelName === 'Cycle';
  },
  initializeOrder() {
    if (!this.model) {
      return;
    }

    const sortingInfo = getSortingForModel(this.model.model_singular);
    this.orderBy = {
      field: sortingInfo.key,
      direction: sortingInfo.direction,
    };
  },
  init() {
    this.initializeOrder();
    this.initializeColumns();
  },
});

export default canComponent.extend({
  tag: 'tree-header',
  view: canStache(template),
  leakScope: true,
  ViewModel,
  events: {
    '{viewModel} availableColumns'() {
      this.viewModel.initializeColumns();
    },
    '{viewModel} selectedColumns'() {
      this.viewModel.initializeColumns();
    },
    '{viewModel.orderBy} changed'() {
      this.viewModel.onOrderChange();
    },
  },
});
