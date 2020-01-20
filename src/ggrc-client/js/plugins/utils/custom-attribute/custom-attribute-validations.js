/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {
  hasEmptyValue,
} from './custom-attribute-help-utils';

/**
 * @typedef EmptyMandatoryState
 * @property {boolean} hasEmptyMandatoryValue - true if the mandatory value is
 * empty else false.
 */

/**
 * @typedef GCAState
 * @property {boolean} hasGCAErrors - true if there is GCA errors else false.
 */

/**
 * Returns the object with the state of emptiness the mandatory value.
 * @param {Injection} injection
 * @param {CustomAttributeObject} injection.currentCaObject - Custom attribute object.
 * @return {EmptyMandatoryState} - {@link EmptyMandatoryState} object.
 */
function hasEmptyMandatoryValue({currentCaObject}) {
  let state = {
    hasEmptyMandatoryValue: false,
  };

  if (
    hasEmptyValue(currentCaObject) &&
    currentCaObject.mandatory
  ) {
    state.hasEmptyMandatoryValue = true;
  }

  return state;
}

/**
 * Returns the object with the GCA state.
 * @param {Injection} injection
 * @param {CustomAttributeObject} injection.currentCaObject - Custom attribute object.
 * @return {GCAState} - {@link GCAState} object.
 */
function hasGCAErrors({currentCaObject}) {
  const {hasEmptyMandatoryValue: emptyMandatory} =
    hasEmptyMandatoryValue(...arguments);
  return {
    hasGCAErrors: emptyMandatory,
  };
}

export {
  hasEmptyMandatoryValue,
  hasGCAErrors,
};
