/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import * as businessModels from '../../models/business-models';

/**
 * Check provided model name.
 * Returns true if model name contains '_version'
 * @param {String} modelName - model to check
 * @return {Boolean} True or False
 */
function isObjectVersion(modelName) {
  return modelName && typeof modelName === 'string' ?
    modelName.indexOf('_version') > -1 :
    false;
}

function getObjectVersionConfig(modelName) {
  let originalModelName;
  let objectVersion = {};

  if (!isObjectVersion(modelName)) {
    return objectVersion;
  }
  originalModelName = modelName.split('_')[0];

  return {
    originalModelName: originalModelName,
    isObjectVersion: !!originalModelName,
    widgetId: modelName,
    widgetName: businessModels[originalModelName].title_plural +
      ' Versions',
  };
}

export {
  isObjectVersion,
  getObjectVersionConfig,
};
