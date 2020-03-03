/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import '../tree/tree-header-selector';
import '../tree/tree-visible-column-checkbox';
import template from './templates/mapper-results-columns-configuration.stache';
import * as TreeViewUtils from '../../plugins/utils/tree-view-utils';
import * as businessModels from '../../models/business-models';

const ViewModel = canDefineMap.extend({
  selectedColumns: {
    value: () => [],
    set(newValue, setValue) {
      setValue(newValue);
      this.initializeColumns();
    },
  },
  availableColumns: {
    value: () => [],
    set(newValue, setValue) {
      setValue(newValue);
      this.initializeColumns();
    },
  },
  serviceColumns: {
    set(newValue, setValue) {
      setValue(TreeViewUtils.getVisibleColumnsConfig(newValue, newValue));
    },
  },
  modelType: {
    value: '',
  },
  columns: {
    value: () => ({}),
  },
  init() {
    this.initializeColumns();
  },
  getModel() {
    return businessModels[this.modelType];
  },
  initializeColumns() {
    const selectedColumns = this.selectedColumns;
    const availableColumns = this.availableColumns;
    const columns = TreeViewUtils
      .getVisibleColumnsConfig(availableColumns, selectedColumns);

    this.columns = columns;
  },
  setColumns() {
    const selectedNames = this.columns
      .serialize()
      .filter((item) => item.selected)
      .map((item) => item.name);

    const columns =
      TreeViewUtils.setColumnsForModel(
        this.getModel().model_singular,
        selectedNames
      );

    this.selectedColumns = columns.selected;
  },
});

export default canComponent.extend({
  tag: 'mapper-results-columns-configuration',
  view: canStache(template),
  leakScope: true,
  ViewModel,
});
