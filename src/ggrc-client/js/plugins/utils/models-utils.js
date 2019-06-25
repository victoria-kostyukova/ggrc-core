/*
  Copyright (C) 2019 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loIncludes from 'lodash/includes';
import loForEach from 'lodash/forEach';
import loFind from 'lodash/find';
import loSortBy from 'lodash/sortBy';
import {notifier} from './notifiers-utils';
import RefreshQueue from '../../models/refresh_queue';
import * as businessModels from '../../models/business-models';
import * as serviceModels from '../../models/service-models';
import allModels from '../../models/all-models';

const relatedAssessmentsTypes = Object.freeze(['Control', 'Objective']);

const objectTypeDecisionTree = Object.freeze({
  program: businessModels.Program,
  audit: businessModels.Audit,
  contract: businessModels.Contract,
  policy: businessModels.Policy,
  standard: businessModels.Standard,
  regulation: businessModels.Regulation,
  org_group: businessModels.OrgGroup,
  vendor: businessModels.Vendor,
  project: businessModels.Project,
  facility: businessModels.Facility,
  product: businessModels.Product,
  data_asset: businessModels.DataAsset,
  document: businessModels.Document,
  evidence: businessModels.Evidence,
  access_group: businessModels.AccessGroup,
  market: businessModels.Market,
  metric: businessModels.Metric,
  system: businessModels.System,
  process: businessModels.Process,
  control: businessModels.Control,
  assessment: businessModels.Assessment,
  assessment_template: businessModels.AssessmentTemplate,
  issue: businessModels.Issue,
  objective: businessModels.Objective,
  requirement: businessModels.Requirement,
  person: businessModels.Person,
  product_group: businessModels.ProductGroup,
  role: serviceModels.Role,
  technology_environment: businessModels.TechnologyEnvironment,
  threat: businessModels.Threat,
  risk: businessModels.Risk,
  workflow: businessModels.Workflow,
  key_report: businessModels.KeyReport,
  account_balance: businessModels.AccountBalance,
});

const getModelInstance = (id, type, requiredAttr) => {
  const promise = new Promise((resolve, reject) => {
    let modelInstance;

    if (!id || !type || !requiredAttr) {
      reject();
    }

    modelInstance = allModels[type].findInCacheById(id) || {};

    if (modelInstance && modelInstance.hasOwnProperty(requiredAttr)) {
      resolve(modelInstance);
    } else {
      modelInstance = new allModels[type]({id: id});
      new RefreshQueue()
        .enqueue(modelInstance)
        .trigger()
        .done((data) => {
          data = Array.isArray(data) ? data[0] : data;
          resolve(data);
        })
        .fail(function () {
          notifier('error', `Failed to fetch data for ${type}: ${id}.`);
          reject();
        });
    }
  });

  return promise;
};

const inferObjectType = (data) => {
  if (!data) {
    return null;
  } else {
    let obj = loFind(Object.keys(data), (key) => objectTypeDecisionTree[key]);
    return objectTypeDecisionTree[obj];
  }
};

/**
 * Check the model has Related Assessments
 * @param {String} type - model type
 * @return {Boolean}
 */
const hasRelatedAssessments = (type) => {
  return loIncludes(relatedAssessmentsTypes, type);
};

const getInstance = (objectType, objectId) => {
  let model = allModels[objectType];

  if (!model) {
    return null;
  }

  if (!objectId) {
    return null;
  }

  let instance = model.findInCacheById(objectId);
  if (!instance) {
    instance = new model({
      id: objectId,
      type: objectType,
    });
  }
  return instance;
};

function isScopeModel(type) {
  const model = businessModels[type];

  return model && model.category === 'scope';
}

/**
 * Return Model Constructor Instance
 * @param {String} type - Model type
 * @return {Cacheble|null} - Return Model Constructor
 */
const getModelByType = (type) => {
  if (!type || typeof type !== 'string') {
    console.warn('Type is not provided or has incorrect format.',
      'Value of Type is:', type);
    return null;
  }
  return allModels[type];
};

/**
 * Returns models with custom roles
 * @return {Array} list of models
 */
function getRoleableModels() {
  return Object.keys(businessModels)
    .filter((modelName) => businessModels[modelName].isRoleable)
    .map((modelName) => businessModels[modelName]);
}

/**
 * Returns models with custom roles
 * @return {Array} list of models
 */
function getCustomAttributableModels() { // eslint-disable-line
  return Object.keys(businessModels)
    .filter((modelName) => businessModels[modelName].is_custom_attributable)
    .map((modelName) => businessModels[modelName]);
}

/**
 * Return grouped types.
 * @param {Array} types - array of base model types
 * @return {Array} - object with one allowed for mapping Model
 */
function groupTypes(types) {
  let groups = {
    entities: {
      name: 'People/Groups',
      items: [],
    },
    scope: {
      name: 'Scope',
      items: [],
    },
    governance: {
      name: 'Governance',
      items: [],
    },
  };

  types.forEach((modelName) => {
    return _addFormattedType(modelName, groups);
  });

  loForEach(groups, (group) => {
    group.items = loSortBy(group.items, 'name');
  });

  return groups;
}

/**
 * Adds model to correct group.
 * @param {string} modelName - model name
 * @param {object} groups - type groups
 */
function _addFormattedType(modelName, groups) {
  let cmsModel = getModelByType(modelName);
  if (!cmsModel || !cmsModel.title_singular) {
    return;
  }

  let type = {
    category: cmsModel.category,
    name: cmsModel.title_plural,
    value: cmsModel.model_singular,
  };

  let group = !groups[type.category] ?
    groups.governance :
    groups[type.category];

  group.items.push(type);
}

export {
  getModelInstance,
  hasRelatedAssessments,
  relatedAssessmentsTypes,
  inferObjectType,
  getInstance,
  isScopeModel,
  getModelByType,
  getRoleableModels,
  getCustomAttributableModels,
  groupTypes,
};
