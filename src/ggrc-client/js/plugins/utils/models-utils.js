/*
  Copyright (C) 2018 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {notifier} from './notifiers-utils';
import RefreshQueue from '../../models/refresh_queue';
import Stub from '../../models/stub';

const relatedAssessmentsTypes = Object.freeze(['Control', 'Objective']);

const getModelInstance = (id, type, requiredAttr) => {
  const promise = new Promise((resolve, reject) => {
    let modelInstance;

    if (!id || !type || !requiredAttr) {
      reject();
    }

    modelInstance = CMS.Models[type].findInCacheById(id) || {};

    if (modelInstance && modelInstance.hasOwnProperty(requiredAttr)) {
      resolve(modelInstance);
    } else {
      modelInstance = new CMS.Models[type]({id: id});
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
  let decisionTree = _getObjectTypeDecisionTree();

  function resolve(subtree, data) {
    if (typeof subtree === 'undefined') {
      return null;
    }
    return can.isPlainObject(subtree) ?
      subtree._discriminator(data) :
      subtree;
  }

  if (!data) {
    return null;
  } else {
    return can.reduce(Object.keys(data), function (a, b) {
      return a || resolve(decisionTree[b], data[b]);
    }, null);
  }
};

const makeModelInstance = (data) => {
  if (!data) {
    return null;
  } else if (!!GGRC.page_model && GGRC.page_object === data) {
    return GGRC.page_model;
  } else {
    return GGRC.page_model = inferObjectType(data).model($.extend({}, data));
  }
};

/**
 * Check the model has Related Assessments
 * @param {String} type - model type
 * @return {Boolean}
 */
const hasRelatedAssessments = (type) => {
  return _.includes(relatedAssessmentsTypes, type);
};

function _getObjectTypeDecisionTree() { // eslint-disable-line
  let tree = {};
  let extensions = GGRC.extensions || [];

  can.each(extensions, function (extension) {
    if (extension.object_type_decision_tree) {
      if (can.isFunction(extension.object_type_decision_tree)) {
        $.extend(tree, extension.object_type_decision_tree());
      } else {
        $.extend(tree, extension.object_type_decision_tree);
      }
    }
  });

  return tree;
}

const getInstance = (objectType, objectId, paramsOrObject) => {
  let model;
  let params = {};
  let instance;
  let href;

  if (typeof objectType === 'object' || objectType instanceof Stub) {
    // assume we only passed in params_or_object
    paramsOrObject = objectType;
    if (!paramsOrObject) {
      return null;
    }
    if (paramsOrObject instanceof can.Model) {
      objectType = paramsOrObject.constructor.shortName;
    } else if (paramsOrObject instanceof Stub) {
      objectType = paramsOrObject.type;
    } else if (!paramsOrObject.selfLink && paramsOrObject.type) {
      objectType = paramsOrObject.type;
    } else {
      href = paramsOrObject.selfLink || paramsOrObject.href;
      objectType = can.map(
        window.cms_singularize(/^\/api\/(\w+)\//.exec(href)[1]).split('_'),
        can.capitalize
      ).join('');
    }
    objectId = paramsOrObject.id;
  }

  model = CMS.Models[objectType];

  if (!model) {
    return null;
  }

  if (!objectId) {
    return null;
  }

  if (paramsOrObject) {
    if ($.isFunction(paramsOrObject.serialize)) {
      $.extend(params, paramsOrObject.serialize());
    } else {
      $.extend(params, paramsOrObject || {});
    }
  }

  instance = model.findInCacheById(objectId);
  if (!instance) {
    if (params.selfLink) {
      params.id = objectId;
      instance = new model(params);
    } else {
      instance = new model({
        id: objectId,
        type: objectType,
        href: (paramsOrObject || {}).href,
      });
    }
  }
  return instance;
};

function isScopeModel(type) {
  const model = CMS.Models[type];

  return model && model.category === 'business';
}

export {
  getModelInstance,
  hasRelatedAssessments,
  relatedAssessmentsTypes,
  makeModelInstance,
  inferObjectType,
  getInstance,
  isScopeModel,
};
