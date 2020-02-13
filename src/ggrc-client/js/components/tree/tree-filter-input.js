/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import template from './templates/tree-filter-input.stache';
import router from '../../router';
import QueryParser from '../../generated/ggrc-filter-query-parser';

const ViewModel = canDefineMap.extend({
  filter: {
    type: 'string',
    set(newValue = '') {
      this.onFilterChange(newValue);
      return newValue;
    },
  },
  isExpression: {
    type: 'boolean',
    value: false,
  },
  isFiltered: {
    value: false,
  },
  showAdvanced: {
    value: false,
  },
  showEmailImport: {
    value: false,
  },
  onFilter() {
    this.dispatch('submitFilter');
  },
  onFilterChange(newValue) {
    let filter = QueryParser.parse(newValue);
    let isExpression =
      !!filter && !!filter.expression.op &&
      filter.expression.op.name !== 'text_search' &&
      filter.expression.op.name !== 'exclude_text_search';
    this.isExpression = isExpression;

    this.dispatch({
      type: 'searchQueryChanged',
      name: 'custom',
      query: newValue.length ? filter : null,
    });
  },
  setupFilterFromUrl() {
    this.filter = router.attr('query');
  },
  openAdvancedFilter() {
    this.dispatch('openAdvanced');
  },
  removeAdvancedFilters() {
    this.dispatch('removeAdvanced');
  },
});

export default canComponent.extend({
  tag: 'tree-filter-input',
  view: canStache(template),
  leakScope: true,
  ViewModel,
  events: {
    inserted() {
      this.viewModel.setupFilterFromUrl();
      this.viewModel.dispatch({
        type: 'treeFilterReady',
        filterName: 'tree-filter-input',
      });
    },
    'input keyup'(el, ev) {
      this.viewModel.onFilterChange(el.val());

      if (ev.keyCode === 13) {
        this.viewModel.onFilter();
      }
      ev.stopPropagation();
    },
    '{viewModel} isFiltered'() {
      this.viewModel.filter = '';
    },
  },
});
