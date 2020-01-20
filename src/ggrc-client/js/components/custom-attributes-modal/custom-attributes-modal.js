/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import canComponent from 'can-component';

const viewModel = canMap.extend({
  attributeTypes: [
    'Text',
    'Rich Text',
    'Date',
    'Checkbox',
    'Multiselect',
    'Dropdown',
  ],
  instance: null,
  onAttributeTypeUpdate() {
    const instance = this.attr('instance');
    const attributeType = instance.attr('attribute_type');

    if (
      attributeType !== 'Dropdown' &&
      attributeType !== 'Multiselect'
    ) {
      instance.attr('multi_choice_options', null);
    }
  },
});

const events = {
  '{viewModel.instance} attribute_type'() {
    this.viewModel.onAttributeTypeUpdate();
  },
};

export default canComponent.extend({
  tag: 'custom-attributes-modal',
  leakScope: true,
  viewModel,
  events,
});
