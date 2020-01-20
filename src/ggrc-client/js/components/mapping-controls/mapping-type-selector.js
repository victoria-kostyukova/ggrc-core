/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loMap from 'lodash/map';
import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './mapping-type-selector.stache';

export default canComponent.extend({
  tag: 'mapping-type-selector',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    disabled: false,
    readonly: false,
    types: [],
    selectedType: '',
    // Dispatch event after change of "selectedType" to know
    // that "selectedType" was changed via dropdown (currnet component).
    // Because that property can be changed via "saved-search-list".
    // Both cases need different ways to handle "change" event
    onChanged() {
      this.dispatch({
        type: 'selectedTypeChanged',
        modelName: this.attr('selectedType'),
      });
    },
  }),
  init: function () {
    let selectedType = this.viewModel.selectedType;
    let types = this.viewModel.types;
    let groups = ['scope', 'entities', 'governance'];
    let values = [];

    groups.forEach(function (name) {
      let groupItems = types.attr(name + '.items');
      values = values.concat(loMap(groupItems, 'value'));
    });
    if (values.indexOf(selectedType) < 0) {
      this.viewModel.attr('selectedType', values[0]);
    }
  },
});
