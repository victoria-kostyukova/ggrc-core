/*
 Copyright (C) 2018 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

/**
 * Util methods for integration with GGRCQ.
 */

/**
 * Determine whether model type could have mapped questions.
 * @param {String} type - The model name
 * @return {Boolean} True or False
 */
function hasQuestions(type) {
  const model = CMS.Models[type];

  return model && model.isQuestionnaireable;
}

/**
 * Get url to page with questions.
 * @param {String} slug - The model slug
 * @param {String} model - The model name
 * @return {String} Url to questions
 */
function getUrl(slug, model) {
  let url = GGRC.GGRC_Q_INTEGRATION_URL;
  if (!url) {
    return '';
  }
  if (!url.endsWith('/')) {
    url += '/';
  }
  slug = slug.toLowerCase();
  model = model.toLowerCase().replace(/ /g, '_');

  return `${url}questionnaires/${model}=${slug}`;
}

/**
 * Get url to page with questions.
 * @param {Object} instance - The model instance
 * @return {String} Url to questions
 */
function getQuestionsUrl(instance) {
  return getUrl(instance.slug, instance.class.title_singular);
}

export {
  hasQuestions,
  getQuestionsUrl,
};
