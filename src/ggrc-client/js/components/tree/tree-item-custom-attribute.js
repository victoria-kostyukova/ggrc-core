/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loHas from 'lodash/has';
import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import {CONTROL_TYPE} from '../../plugins/utils/control-utils';
import {formatDate} from '../../plugins/utils/date-utils';
import {convertMarkdownToHtml} from '../../plugins/utils/markdown-utils';

const formatValueMap = {
  [CONTROL_TYPE.CHECKBOX](caObject) {
    return caObject.value ? 'Yes' : 'No';
  },
  [CONTROL_TYPE.DATE](caObject) {
    const date = caObject.value === ''
      ? null
      : caObject.value;

    return formatDate(date, true);
  },
  [CONTROL_TYPE.TEXT](caObject, isMarkdown) {
    let value = caObject.value;

    return isMarkdown ? convertMarkdownToHtml(value) : value;
  },
};

/*
  Used to get the string value for custom attributes
*/
const getCustomAttrValue = (instance, customAttributeId) => {
  let hasHandler = false;
  let customAttrValue = null;
  let caObject = instance.customAttr(customAttributeId);

  if (caObject) {
    hasHandler = loHas(formatValueMap, caObject.attributeType);
    customAttrValue = caObject.value;
  }

  if (hasHandler) {
    const handler = formatValueMap[caObject.attributeType];
    const isMarkdown = instance.constructor.isChangeableExternally;

    customAttrValue = handler(caObject, isMarkdown);
  }

  return customAttrValue || '';
};

const viewModel = canMap.extend({
  define: {
    value: {
      get() {
        let instance = this.attr('instance');
        let attrId = this.attr('customAttributeId');
        return getCustomAttrValue(instance, attrId);
      },
    },
  },
  instance: null,
  customAttributeId: null,
});

export default canComponent.extend({
  tag: 'tree-item-custom-attribute',
  view: canStache('{{{value}}}'),
  leakScope: true,
  viewModel,
});
