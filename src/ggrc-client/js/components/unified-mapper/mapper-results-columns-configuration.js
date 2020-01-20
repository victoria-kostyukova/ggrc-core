/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import '../tree/tree-header-selector';
import '../tree/tree-visible-column-checkbox';
import template from './templates/mapper-results-columns-configuration.stache';
import * as TreeViewUtils from '../../plugins/utils/tree-view-utils';
import * as businessModels from '../../models/business-models';

export default canComponent.extend({
  tag: 'mapper-results-columns-configuration',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      selectedColumns: {
        set(newValue, setValue) {
          setValue(newValue);
          this.initializeColumns();
        },
      },
      availableColumns: {
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
    },
    modelType: '',
    selectedColumns: [],
    availableColumns: [],
    columns: {},
    init() {
      this.initializeColumns();
    },
    getModel() {
      return businessModels[this.attr('modelType')];
    },
    initializeColumns() {
      const selectedColumns = this.attr('selectedColumns');
      const availableColumns = this.attr('availableColumns');
      const columns = TreeViewUtils
        .getVisibleColumnsConfig(availableColumns, selectedColumns);

      this.attr('columns', columns);
    },
    setColumns() {
      const selectedNames = this.attr('columns')
        .attr()
        .filter((item) => item.selected)
        .map((item) => item.name);

      const columns =
        TreeViewUtils.setColumnsForModel(
          this.getModel().model_singular,
          selectedNames
        );

      this.attr('selectedColumns', columns.selected);
    },
  }),
});
