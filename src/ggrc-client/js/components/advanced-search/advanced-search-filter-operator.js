/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './advanced-search-filter-operator.stache';

/**
 * Filter Operator view model.
 * Contains logic used in Filter Operator component
 * @constructor
 */
let viewModel = canMap.extend({
  define: {
    disabled: {
      type: 'boolean',
      value: false,
    },
  },
  /**
   * Contains operation name.
   * @type {string}
   * @example
   * AND
   * OR
   */
  operator: '',
});

/**
 * Filter Operator is a component representing operation connecting Advanced Search items.
 */
export default canComponent.extend({
  tag: 'advanced-search-filter-operator',
  view: canStache(template),
  leakScope: true,
  viewModel: viewModel,
});
