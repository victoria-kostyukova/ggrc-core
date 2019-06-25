/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loFlow from 'lodash/flow';
import loIsEmpty from 'lodash/isEmpty';
import loTrim from 'lodash/trim';
import {getPlainText} from '../../ggrc_utils';

/**
 * Checks if the [custom attribute object]{@link CustomAttributeObject} has
 * an empty value.
 * @param {CustomAttributeObject} caObject - The custom attribute object.
 * @return {boolean} - true if caObject has an empty value else false.
 */
function hasEmptyValue(caObject) {
  const value = caObject.value;

  if (typeof value === 'string') {
    return loFlow(getPlainText, loTrim, loIsEmpty)(value);
  }

  return Boolean(value) === false;
}

export {
  hasEmptyValue,
};
