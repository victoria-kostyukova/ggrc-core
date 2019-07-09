/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loCapitalize from 'lodash/capitalize';
import * as businessModels from '../../models/business-models';

/**
 * Util methods for work with Mega Object.
 */

/**
 * Compose mega object specific widget names,
 * e.g. ['Program_child', 'Program_parent']
 * @param {String} widgetName - widget name
 * @return {Array} Array of related widget names
 */
function getRelatedWidgetNames(widgetName) {
  return [widgetName + '_child', widgetName + '_parent'];
}

/**
 * Check if widget name has relation to Mega object
 * @param {String} widgetName - widget name
 * @return {Boolean} True or False
 */
function isMegaObjectRelated(widgetName) {
  return widgetName.indexOf('_child') > -1 ||
    widgetName.indexOf('_parent') > -1;
}

/**
 * Check if mapping between models is mega mapping
 * @param {String} model1 - First model
 * @param {String} model2 - Second model
 * @return {Boolean} True or False
 */
function isMegaMapping(model1, model2) {
  return model1 === model2 && !!businessModels[model1].isMegaObject;
}

/**
 * Config for mega object
 * @param {String} modelName - model name
 * @return {Object} config
 */
function getMegaObjectConfig(modelName) {
  let [originalModelName, relation] = modelName.split('_');
  let modelTitle = businessModels[originalModelName].title_plural;

  return {
    name: originalModelName,
    originalModelName,
    widgetId: modelName,
    widgetName: `${loCapitalize(relation)} ${modelTitle}`,
    relation: relation,
    isMegaObject: true,
  };
}

/**
 * Get relation to mega object (child or parent)
 * @param {String} modelName - name of a model
 * @return {Object} Source model and relation
 */
function getMegaObjectRelation(modelName = '') {
  let [originalModelName, postfix] = modelName.split('_');
  return {
    source: originalModelName,
    relation: postfix,
  };
}

/**
 * Transform query for objects into query for mega object
 * @param {Object} query - original query
 * @param {string} relation - child/parent relation type
 * @return {Object} The transformed query
 */
function transformQueryForMega(query, relation) {
  const expression = query.filters.expression;

  if (expression) {
    expression.op = {
      name: relation,
    };
  }

  if (query.fields && (query.fields.indexOf('is_mega') === -1)) {
    query.fields = query.fields.concat(['is_mega']);
  }

  return query;
}

export {
  getRelatedWidgetNames,
  isMegaObjectRelated,
  isMegaMapping,
  getMegaObjectConfig,
  getMegaObjectRelation,
  transformQueryForMega,
};
