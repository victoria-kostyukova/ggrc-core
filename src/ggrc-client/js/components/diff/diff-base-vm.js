/*
 Copyright (C) 2019 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loFind from 'lodash/find';
import canMap from 'can-map';
export default canMap.extend({
  currentInstance: {},
  diff: [],
  emptyValue: '—',
  getAttrDisplayName(name) {
    const instanceType = this.attr('currentInstance.type');
    const attrDefs = GGRC.model_attr_defs[instanceType];
    let displayName;

    if (!attrDefs) {
      return name;
    }

    displayName = (loFind(attrDefs, (attr) => attr.attr_name === name) || {})
      .display_name;

    return displayName || name;
  },
  getDisplayName(object) {
    let displayName;
    let objectName;

    if (!object) {
      return this.attr('emptyValue');
    }

    // display_name is function in case when object is instance of Cacheable
    displayName = typeof object.display_name === 'function' ?
      object.display_name() :
      object.display_name;

    objectName = displayName ||
      object.title ||
      object.name ||
      this.attr('emptyValue');

    return objectName;
  },
});
