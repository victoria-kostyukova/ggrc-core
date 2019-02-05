/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {
  ggrcqDirectiveObjects,
  scopingObjects,
} from '../../plugins/models-types-collections';

/**
 * Util methods for integration with GGRCQ.
 */

/**
 * Determine whether model type could have mapped questions.
 * @param {Object} instance - The model instance
 * @return {Boolean} True or False
 */
function hasQuestions(instance) {
  return instance &&
    instance.constructor &&
    instance.constructor.isQuestionnaireable;
}

/**
 * Determine whether model type is changeable externally.
 * @param {Object} instance - The model instance
 * @return {Boolean} True or False
 */
function isChangeableExternally(instance) {
  return instance &&
    instance.constructor &&
    instance.constructor.isChangeableExternally;
}

/**
 * Get url to questionnaire
 * @param {Object} options - The url options
 * @param {String} options.model - The model name
 * @param {String} options.path - The questionnaire path
 * @param {String} options.slug - The model slug
 * @param {String} options.view - The view path
 * @param {String} options.params - Additional url params
 * @return {String} Url to questions
 */
function getUrl({model, path, slug, view, params}) {
  let url = GGRC.GGRC_Q_INTEGRATION_URL;
  if (!url) {
    return '';
  }
  if (!url.endsWith('/')) {
    url += '/';
  }

  let modelParams = '';

  if (model && slug) {
    model = model.toLowerCase();
    slug = slug.toLowerCase();
    modelParams = `/${model}=${slug}`;
  }

  path = path ? path.toLowerCase() : '';
  view = view ? `/${view}` : '';
  params = params ? `?${params}` : '';

  return `${url}${path}${modelParams}${view}${params}`;
}

/**
 * Get url to page with questions
 * @param {Object} instance - The model instance
 * @return {String} Url to questions
 */
function getQuestionsUrl(instance) {
  return getUrl({
    model: instance.constructor.table_singular,
    path: 'questionnaires',
    slug: instance.slug,
  });
}

/**
 * Get url to info view
 * @param {Object} instance - The model instance
 * @return {String} Url to info view
 */
function getInfoUrl(instance) {
  return getUrl({
    model: instance.constructor.table_singular,
    path: instance.constructor.table_singular,
    slug: instance.slug,
    view: 'info',
  });
}

/**
 * Get url to comment form
 * @param {Object} instance - The model instance
 * @return {String} Url to comment form
 */
function getCommentFormUrl(instance) {
  return getUrl({
    model: instance.constructor.table_singular,
    path: instance.constructor.table_singular,
    slug: instance.slug,
    view: 'info',
    params: 'comments=open',
  });
}

/**
 * Get url to review view
 * @param {Object} instance - The model instance
 * @return {String} Url to review view
 */
function getReviewUrl(instance) {
  return getUrl({
    model: instance.constructor.table_singular,
    path: instance.constructor.table_singular,
    slug: instance.slug,
    view: 'review',
  });
}

/**
 * Get url to import page
 * @return {String} Url to import page
 */
function getImportUrl() {
  return getUrl({
    path: 'import',
  });
}

/**
 * Get url to proposals view
 * @param {Object} instance - The model instance
 * @return {String} Url to proposals view
 */
function getProposalsUrl(instance) {
  return getUrl({
    model: instance.constructor.table_singular,
    path: instance.constructor.table_singular,
    slug: instance.slug,
    view: 'proposals',
  });
}

/**
 * Get url to change log view
 * @param {Object} instance - The model instance
 * @return {String} Url to change log view
 */
function getChangeLogUrl(instance) {
  return getUrl({
    model: instance.constructor.table_singular,
    path: instance.constructor.table_singular,
    slug: instance.slug,
    view: 'change-log',
  });
}

/**
 * Get url to mapping view
 * @param {Object} instance - The model instance
 * @param {Object} destinationModel - The destination model
 * @return {String} Url to mapping view
 * */
function getMappingUrl(instance, destinationModel) {
  if (instance.type === 'Control') {
    return getMapObjectToControlUrl(instance, destinationModel);
  } else if (destinationModel.title_singular === 'Control') {
    return getMapControlToObjectUrl(instance, destinationModel);
  }

  return '';
}


function getMapObjectToControlUrl(instance, destinationModel) {
  let view = '';
  if (ggrcqDirectiveObjects. includes(destinationModel.model_singular)) {
    view = 'directives';
  } else if (scopingObjects.includes(destinationModel.model_singular)) {
    view = 'scope';
  }

  let params = 'mappingStatus=in_progress,not_in_scope,reviewed&types=' +
    destinationModel.table_singular;

  return getUrl({
    path: 'control',
    model: instance.constructor.table_singular,
    slug: instance.slug,
    view,
    params,
  });
}

function getMapControlToObjectUrl(instance) {
  let path = '';
  let type = instance.constructor.model_singular;
  if (ggrcqDirectiveObjects.includes(type)) {
    path = 'directives';
  } else if (scopingObjects.includes(type)) {
    path = 'questionnaires';
  }

  return getUrl({
    path,
    model: instance.constructor.table_singular,
    slug: instance.slug,
    view: 'controls',
    params: 'mappingStatus=in_progress,not_in_scope,reviewed',
  });
}

export {
  hasQuestions,
  isChangeableExternally,
  getCommentFormUrl,
  getQuestionsUrl,
  getImportUrl,
  getInfoUrl,
  getReviewUrl,
  getMappingUrl,
  getUrl,
  getProposalsUrl,
  getChangeLogUrl,
};
