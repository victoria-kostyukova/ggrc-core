/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loMap from 'lodash/map';
import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import template from './mapping-type-selector.stache';

const ViewModel = canDefineMap.extend({
  disabled: {
    value: false,
  },
  readonly: {
    value: false,
  },
  types: {
    value: () => [],
  },
  selectedType: {
    value: '',
  },
  // Dispatch event after change of "selectedType" to know
  // that "selectedType" was changed via dropdown (current component).
  // Because that property can be changed via "saved-search-list".
  // Both cases need different ways to handle "change" event
  onChanged() {
    this.dispatch({
      type: 'selectedTypeChanged',
      modelName: this.selectedType,
    });
  },
});

export default canComponent.extend({
  tag: 'mapping-type-selector',
  view: canStache(template),
  leakScope: true,
  ViewModel,
  init() {
    const selectedType = this.viewModel.selectedType;
    const types = this.viewModel.types;
    const groups = ['scope', 'entities', 'governance'];
    let values = [];

    groups.forEach((name) => {
      const group = types.get(name);
      const groupItems = group.items;
      values = values.concat(loMap(groupItems, 'value'));
    });
    if (values.indexOf(selectedType) < 0) {
      this.viewModel.selectedType = values[0];
    }
  },
});
