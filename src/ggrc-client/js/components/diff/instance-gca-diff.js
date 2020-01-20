/*
 Copyright (C) 2020 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import {REFRESH_PROPOSAL_DIFF} from '../../events/event-types';
import DiffBaseVM from './diff-base-vm';
import template from './templates/instance-diff-items.stache';
import {formatDate} from '../../../js/plugins/utils/date-utils';

const viewModel = DiffBaseVM.extend({
  modifiedAttributes: {},
  _customAttributesValues: [],

  prepareAttributes() {
    const values = this.attr('currentInstance.custom_attribute_values');

    this.attr('_customAttributesValues', values);
  },
  buildDiffObject() {
    const modifiedAttributes = this.attr('modifiedAttributes');
    const caKeys = canMap.keys(modifiedAttributes);

    this.prepareAttributes();
    this.attr('diff', []);

    caKeys.forEach((attrId) => {
      attrId = Number(attrId);

      let attr = this.getValueAndDefinition(attrId);
      let modifiedAttr = modifiedAttributes[attrId];

      // attr was deleted
      if (!attr.def) {
        return;
      }

      const diffObject = this.buildAttributeDiff(modifiedAttr, attr);
      this.attr('diff').push(diffObject);
    });
  },
  buildAttributeDiff(modifiedAttr, currentAttr) {
    const value = currentAttr.value;
    const def = currentAttr.def;
    let modifiedVal = this.attr('emptyValue');
    let currentVal = this.attr('emptyValue');

    if (value) {
      currentVal = this
        .convertValue(value.attribute_value, def.attribute_type);
    }

    if (modifiedAttr && modifiedAttr.attribute_value) {
      modifiedVal = this
        .convertValue(modifiedAttr.attribute_value, def.attribute_type);
    }

    return {
      attrName: def.title,
      currentVal: [currentVal],
      modifiedVal: [modifiedVal],
    };
  },
  convertValue(value, type) {
    if (!value) {
      return this.attr('emptyValue');
    }

    switch (type) {
      case 'Date':
        return formatDate(value, true);
      case 'Checkbox':
        return value === true || value === '1' ?
          '✓' :
          this.attr('emptyValue');
      default:
        return value;
    }
  },
  getValueAndDefinition(attrId) {
    const instance = this.attr('currentInstance');
    const value = this.attr('_customAttributesValues').attr()
      .find((val) => val.custom_attribute_id === attrId);
    const definition = instance.attr('custom_attribute_definitions').attr()
      .find((def) => def.id === attrId);

    return {
      value: value,
      def: definition,
    };
  },
});

export default canComponent.extend({
  tag: 'instance-gca-diff',
  view: canStache(template),
  leakScope: true,
  viewModel: viewModel,
  events: {
    buildDiff() {
      const instance = this.viewModel.attr('currentInstance');
      const modifiedCA = this.viewModel.attr('modifiedAttributes');
      if (!modifiedCA || !instance) {
        return;
      }
      this.viewModel.buildDiffObject();
    },
    inserted() {
      this.buildDiff();
    },
    [`{viewModel.currentInstance} ${REFRESH_PROPOSAL_DIFF.type}`]() {
      this.buildDiff();
    },
  },
});
