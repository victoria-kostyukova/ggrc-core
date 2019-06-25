/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loSome from 'lodash/some';
import canMap from 'can-map';
// Base viewModel for custom autocomplete. Must be extended into component.
// Provides component-wrapper for custom autocomplete.
// Must contain 'autocomplete-results' and 'autocomplete-input' components.

import {
  buildParam,
  batchRequests,
} from '../../plugins/utils/query-api-utils';

export default canMap.extend({
  currentValue: '',
  modelName: null,
  modelConstructor: null,
  result: [],
  objectsToExclude: [],
  showResults: false,
  showNewValue: false,
  queryField: 'title',
  getResult: function (event) {
    return this.requestItems(event.value)
      .then((data) => {
        const modelName = this.attr('modelName');
        const result = this.filterResult(data[modelName].values);
        this.attr('currentValue',
          event.value);
        this.attr('result', result);
        this.attr('showNewValue', this.isCurrentValueUnique(result));
        this.attr('showResults', true);
      });
  },
  // Gets 10 items using QueryAPI
  requestItems: function (value) {
    let queryField = this.attr('queryField');
    let objName = this.attr('modelName');
    let filter = {
      expression: {
        left: queryField,
        op: {name: '~'},
        right: value,
      },
    };
    let query = buildParam(
      objName,
      {
        current: 1,
        pageSize: 10,
      },
      null,
      null,
      filter
    );

    return batchRequests(query);
  },
  filterResult: function (result) {
    let objects = this.attr('objectsToExclude');

    result = result.filter((item) => {
      return !loSome(objects, (object) => item.id === object.id);
    });

    return result;
  },
  isCurrentValueUnique: function (result) {
    let objects = this.attr('objectsToExclude').concat(result);
    let currentValue = this.attr('currentValue').toLowerCase();

    return !loSome(objects, (object) =>
      object.name.toLowerCase() === currentValue);
  },
});
