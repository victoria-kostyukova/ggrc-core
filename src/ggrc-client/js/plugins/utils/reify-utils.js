/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loMap from 'lodash/map';
import canModel from 'can-model';
import canList from 'can-list';
import canMap from 'can-map';
import allModels from '../../models/all-models';

function reify(obj) {
  if (obj instanceof canList) {
    return reifyList(obj);
  }

  if (obj instanceof canMap) {
    return reifyMap(obj);
  }
}

function isReifiable(obj) {
  return obj instanceof canMap;
}

function reifyMap(obj) {
  const type = obj.type;
  const model = allModels[type];

  if (obj instanceof canModel) {
    return obj;
  }

  if (!model) {
    console.warn('`reifyMap()` called with unrecognized type', obj);
  } else {
    return model.model(obj);
  }
}

function reifyList(obj) {
  return new canList(loMap(obj, function (item) {
    return reifyMap(item);
  }));
}

export {
  reify,
  reifyMap,
  reifyList,
  isReifiable,
};
