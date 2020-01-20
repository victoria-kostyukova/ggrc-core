/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './gca-controls.stache';
import '../custom-attributes/custom-attributes-field';
import isFunction from 'can-util/js/is-function/is-function';
import {CUSTOM_ATTRIBUTE_TYPE} from '../../plugins/utils/custom-attribute/custom-attribute-config';
import {CONTROL_TYPE} from './../../plugins/utils/control-utils';

const errorMessages = {
  [CONTROL_TYPE.CHECKBOX]: 'this checkbox is required',
  any: 'cannot be blank',
};

/**
 * This component renders edit controls for Global Custom Attributes
 */

export default canComponent.extend({
  tag: 'gca-controls',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    instance: {},
    items: [],
    allowHide: false,
    validateControls: function () {
      this.attr('instance').validateGCAs();
    },
    initGlobalAttributes: function () {
      const instance = this.attr('instance');
      const globalCaObjects = instance.customAttr({
        type: CUSTOM_ATTRIBUTE_TYPE.GLOBAL,
      });
      this.attr('items', globalCaObjects);
    },
    updateGlobalAttribute: function (event) {
      const instance = this.attr('instance');
      const {
        fieldId: caId,
        value: caValue,
      } = event;

      instance.customAttr(caId, caValue);
      this.validateControls();
    },
  }),
  helpers: {
    errorMessage(type) {
      type = isFunction(type) ? type() : type;
      return errorMessages[type] || errorMessages.any;
    },
    isHidable(item, options) {
      item = isFunction(item) ? item() : item;
      const hidable = (this.attr('allowHide') && !item.mandatory);
      return hidable
        ? options.fn()
        : options.inverse();
    },
  },
  init: function () {
    if (!this.viewModel.attr('items').length) {
      this.viewModel.initGlobalAttributes();
    }

    this.viewModel.validateControls();
  },
});
