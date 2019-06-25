/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loMerge from 'lodash/merge';
import loIsEqual from 'lodash/isEqual';
import {
  simpleFieldResolver,
  customAttributeResolver,
} from './conflict-resolvers';

export function tryResolveConflictValues(baseAttrs, attrs, remoteAttrs, obj) {
  let hasConflict = false;

  Object.keys(baseAttrs).forEach((key) => {
    let unableToResolve = false;

    switch (key) {
      // We skip the updated_at key because we know it has changed
      case 'updated_at':
        break;
      // We have a special way for customAttributes because it is nested field
      case 'custom_attribute_values':
        unableToResolve = customAttributeResolver(
          baseAttrs[key],
          attrs[key],
          remoteAttrs[key],
          obj.attr(key));
        break;
      default:
        unableToResolve = simpleFieldResolver(
          baseAttrs,
          attrs,
          remoteAttrs,
          obj,
          key);
    }

    hasConflict = hasConflict || unableToResolve;
  });

  return hasConflict;
}

export default function resolveConflict(xhr, obj, remoteAttrs) {
  let attrs = loMerge({}, obj.attr());
  let baseAttrs = loMerge({}, obj._backupStore()) || {};

  if (loIsEqual(remoteAttrs, attrs)) {
    // current state is same as server state -- do nothing.
    return obj;
  } else if (loIsEqual(remoteAttrs, baseAttrs)) {
    // base state matches server state -- no incorrect expectations -- save.
    return obj.save();
  }

  // merge current instance with remote attributes
  obj.attr(remoteAttrs);

  // check what properties changed -- we can merge if the same prop wasn't changed on both
  let stillHasConflict =
    tryResolveConflictValues(baseAttrs, attrs, remoteAttrs, obj);
  if (stillHasConflict) {
    xhr.remoteObject = remoteAttrs;
    return new $.Deferred().reject(xhr);
  }

  return obj.save();
}
