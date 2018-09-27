/*
  Copyright (C) 2018 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {notifier} from './notifiers-utils';
import RefreshQueue from '../../models/refresh_queue';
import Stub from '../../models/stub';
import * as businessModels from '../../models/business-models';
import * as serviceModels from '../../models/service-models';
import * as joinModels from '../../models/join-models';

const allModels = Object.assign({},
  businessModels,
  serviceModels,
  joinModels);

const relatedAssessmentsTypes = Object.freeze(['Control', 'Objective']);

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
  let decisionTree = _(GGRC.extensions)
    .filter((extension) => extension.object_type_decision_tree)
    .reduce((tree, extension) =>
      Object.assign(tree, extension.object_type_decision_tree()), {});

  if (!data) {
    return null;
  } else {
    return can.reduce(Object.keys(data), (a, b) =>
      a || decisionTree[b] || null, null);
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

  model = allModels[objectType];

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
  const model = businessModels[type];

  return model && model.category === 'business';
}

/**
 * Return Model Constructor Instance
 * @param {String} type - Model type
 * @return {CMS.Model.Cacheble|null} - Return Model Constructor
 */
const getModelByType = (type) => {
  if (!type || typeof type !== 'string') {
    console.warn('Type is not provided or has incorrect format.',
      'Value of Type is:', type);
    return null;
  }
  return allModels[type];
};


can.Observe.prototype.reify = function () {
  let type;
  let model;

  if (this instanceof can.Model) {
    return this;
  }

  type = this.type;
  model = allModels[type];

  if (!model) {
    console.warn('`reify()` called with unrecognized type', this);
  } else {
    return model.model(this);
  }
};

can.Observe.List.prototype.reify = function () {
  return new can.Observe.List(can.map(this, function (obj) {
    return obj.reify();
  }));
};

export {
  getModelInstance,
  hasRelatedAssessments,
  relatedAssessmentsTypes,
  makeModelInstance,
  inferObjectType,
  getInstance,
  isScopeModel,
  getModelByType,
};
