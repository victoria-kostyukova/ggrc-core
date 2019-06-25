/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loGet from 'lodash/get';
import loKeyBy from 'lodash/keyBy';
import loIsEqual from 'lodash/isEqual';
export function buildChangeDescriptor(
  previousValue,
  currentValue,
  remoteValue) {
  // The object attribute was changed on the server
  let isChangedOnServer = !loIsEqual(previousValue, remoteValue);
  // The object attribute was changed on the client
  let isChangedLocally = !loIsEqual(previousValue, currentValue);
  // The change on the server was not the same as the change on the client
  let isDifferent = !loIsEqual(currentValue, remoteValue);

  let hasConflict = (isChangedOnServer && isChangedLocally && isDifferent);

  return {
    hasConflict,
    isChangedLocally,
  };
}

export function simpleFieldResolver(
  baseAttrs = {},
  attrs = {},
  remoteAttrs = {},
  container,
  key,
  rootKey) {
  let previousValue = loGet(baseAttrs, key);
  let currentValue = loGet(attrs, key);
  let remoteValue = loGet(remoteAttrs, key);

  let {hasConflict, isChangedLocally} = buildChangeDescriptor(
    previousValue,
    currentValue,
    remoteValue);

  if (isChangedLocally) {
    let path = rootKey || key;
    let currentRoot = loGet(attrs, path);
    container.attr(path, currentRoot);
  }

  return hasConflict;
}


export function customAttributeResolver(
  previousValue = [],
  currentValue = [],
  remoteValue = [],
  container = []) {
  let currentValuesById = loKeyBy(currentValue, 'custom_attribute_id');
  let remoteValuesById = loKeyBy(remoteValue, 'custom_attribute_id');
  let containerValuesById = loKeyBy(container, 'custom_attribute_id');

  let conflict = false;
  previousValue.forEach((previousValueItem) => {
    let definitionId = previousValueItem.custom_attribute_id;
    let currentValueItem = currentValuesById[definitionId];
    let remoteValueItem = remoteValuesById[definitionId];
    let containerValueItem = containerValuesById[definitionId];

    let hasValueConflict = simpleFieldResolver(
      previousValueItem,
      currentValueItem,
      remoteValueItem,
      containerValueItem,
      'attribute_value');

    let hasObjectConflict = simpleFieldResolver(
      previousValueItem,
      currentValueItem,
      remoteValueItem,
      containerValueItem,
      'attribute_object.id',
      'attribute_object');

    conflict = conflict || hasValueConflict || hasObjectConflict;
  });

  return conflict;
}

