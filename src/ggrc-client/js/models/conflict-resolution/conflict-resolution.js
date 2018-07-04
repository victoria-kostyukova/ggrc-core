/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

function checkValues(baseAttrs, attrs, remoteAttrs, obj) {
  let conflict = false;
  can.each(baseAttrs, function (val, key) {
    // We skip the updated_at key because we know it has changed
    if (key === 'updated_at') {
      return;
    }

    // The object attribute was changed on the server
    if (!can.Object.same(val, remoteAttrs[key]) &&
        // The object attribute was also changed on the client
        !can.Object.same(val, attrs[key]) &&
        // The change on the server was not the same as the change on the client
        !can.Object.same(attrs[key], remoteAttrs[key])) {
      conflict = true;
      // Restore the version that user wrote changes
      obj.attr(key, attrs[key]);
      console.warn('Conflict', key, 'User wrote:', attrs[key],
        'Server has:', remoteAttrs[key], 'User saw', baseAttrs[key]);
      // The attribute hasn't changed on the server
    } else if (can.Object.same(val, remoteAttrs[key]) &&
    // The attribute was changed on the client
               !can.Object.same(val, attrs[key])) {
      obj.attr(key, attrs[key]);
    }
  });
  return conflict;
}

export default function resolveConflict(xhr, obj) {
  let attrs = can.extend(true, {}, obj.attr());
  let baseAttrs = can.extend(true, {}, obj._backupStore()) || {};
  return obj.refresh().then(function (obj) {
    let conflict = false;
    let remoteAttrs = can.extend(true, {}, obj.attr());

    if (can.Object.same(remoteAttrs, attrs)) {
      // current state is same as server state -- do nothing.
      return obj;
    } else if (can.Object.same(remoteAttrs, baseAttrs)) {
      // base state matches server state -- no incorrect expectations -- save.
      return obj.attr(attrs).save();
    }
    // check what properties changed -- we can merge if the same prop wasn't changed on both
    conflict = checkValues(baseAttrs, attrs, remoteAttrs, obj);
    if (conflict) {
      $(document.body).trigger('ajax:flash', {
        warning: GGRC.Errors.messages[409],
      });
      xhr.remoteObject = remoteAttrs;
      return new $.Deferred().reject(xhr, 409, 'CONFLICT');
    }
    return obj.save();
  });
}
