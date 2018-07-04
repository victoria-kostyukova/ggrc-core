/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

export function buildChangeDescriptor(
  previousValue,
  currentValue,
  remoteValue) {
  // The object attribute was changed on the server
  let isChangedOnServer = !can.Object.same(previousValue, remoteValue);
  // The object attribute was changed on the client
  let isChangedLocally = !can.Object.same(previousValue, currentValue);
  // The change on the server was not the same as the change on the client
  let isDifferent = !can.Object.same(currentValue, remoteValue);

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
  key) {
  let previousValue = baseAttrs[key];
  let currentValue = attrs[key];
  let remoteValue = remoteAttrs[key];

  let {hasConflict, isChangedLocally} = buildChangeDescriptor(
    previousValue,
    currentValue,
    remoteValue);

  if (isChangedLocally) {
    container.attr(key, currentValue);
  }

  return hasConflict;
}


export function customAttributeResolver(
  previousValue = [],
  currentValue = [],
  remoteValue = [],
  container = []) {
  let currentValuesById = _.indexBy(currentValue, 'custom_attribute_id');
  let remoteValuesById = _.indexBy(remoteValue, 'custom_attribute_id');
  let containerValuesById = _.indexBy(container, 'custom_attribute_id');

  let conflict = false;
  previousValue.forEach((previousValueItem) => {
    let definitionId = previousValueItem.custom_attribute_id;
    let currentValueItem = currentValuesById[definitionId];
    let remoteValueItem = remoteValuesById[definitionId];
    let containerValueItem = containerValuesById[definitionId];

    let hasConflict = simpleFieldResolver(
      previousValueItem,
      currentValueItem,
      remoteValueItem,
      containerValueItem,
      'attribute_value');

    conflict = conflict || hasConflict;
  });

  return conflict;
}
