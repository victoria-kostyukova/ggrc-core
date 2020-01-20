/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canStache from 'can-stache';
import canComponent from 'can-component';
import baseAutocompleteWrapper from './../custom-autocomplete/autocomplete-wrapper';
import Label from '../../models/service-models/label';

let viewModel = baseAutocompleteWrapper.extend({
  currentValue: '',
  modelName: 'Label',
  modelConstructor: Label,
  queryField: 'name',
  result: [],
  objectsToExclude: [],
  showResults: false,
  showNewValue: false,
});

export default canComponent.extend({
  tag: 'label-autocomplete-wrapper',
  view: canStache('<content/>'),
  leakScope: true,
  viewModel: viewModel,
});
