/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loKeys from 'lodash/keys';
import loIncludes from 'lodash/includes';
import loForEach from 'lodash/forEach';
import canModel from 'can-model';
import canMap from 'can-map';
// TODO: this import is used to correctly build assets. It should be removed and cyclic dependencies should be resolved.
import '../../plugins/utils/models-utils';

import * as businessModels from '../business-models';
import Permission from '../../permission';
import config from './mappings-ggrc';

/*
  Mappings utils
  represents everything known about how GGRC objects connect to each other.
  It contains the set of known mappings.
*/

/**
 * Return list of allowed for mapping models.
 * Performs checks for
 * @param {String} type - base model type
 * @param {Array} include - array of included models
 * @param {Array} exclude - array of excluded models
 * @return {Array} - list of allowed for mapping Models
 */
function getMappingList(type) {
  if (!type) {
    return [];
  }

  let allowedToMap = getAllowedToMapModels(type);
  let externalMap = getExternalMapModels(type);

  return loKeys(Object.assign({}, allowedToMap, externalMap));
}

/**
 * Checks user permissions for mappings
 * @param {Object} source - the source object the mapping
 * @param {Object} target - the target object of the mapping
 *
 * @return {Boolean} whether user has permissions for mappings
 */
function userHasPermissions(source, target) {
  let hasPermissions = Permission.is_allowed_for('update', source)
    || source.isNew();

  if (target instanceof canMap) {
    hasPermissions = hasPermissions
      && Permission.is_allowed_for('update', target);
  }

  return hasPermissions;
}

/**
 * Determine if `target` is allowed to be created and mapped to `source`.
 *
 * @param {Object} source - the source object the mapping
 * @param {Object} target - the target object of the mapping
 *
 * @return {Boolean} - true if mapping is allowed, false otherwise
 */
function allowedToCreate(source, target) {
  let targetType = _getType(target);
  let sourceType = _getType(source);

  let allowedTypes = loKeys(getAllowedToCreateModels(sourceType));
  let canCreate = loIncludes(allowedTypes, targetType);

  return canCreate && userHasPermissions(source, target);
}

/**
 * Determine if `target` is allowed to be mapped to `source`.
 *
 * @param {Object} source - the source object the mapping
 * @param {Object} target - the target object of the mapping
 *
 * @return {Boolean} - true if mapping is allowed, false otherwise
 */
function allowedToMap(source, target) {
  let targetType = _getType(target);
  let sourceType = _getType(source);

  let mappableTypes = loKeys(getAllowedToMapModels(sourceType));
  let externalTypes = loKeys(getExternalMapModels(sourceType));

  let canMap = loIncludes(mappableTypes, targetType) ||
    loIncludes(externalTypes, targetType);

  return canMap && userHasPermissions(source, target);
}

/**
 * Determine if `target` is allowed to be mapped to `source` or created and
 * mapped to 'source'.
 *
 * @param {Object} source - the source object the mapping
 * @param {Object} target - the target object of the mapping
 *
 * @return {Boolean} - true if mapping is allowed, false otherwise
 */
function allowedToCreateOrMap(source, target) {
  let sourceType = _getType(source);
  let targetType = _getType(target);

  let mappableTypes = loKeys(getAllowedToMapModels(sourceType));
  let externalTypes = loKeys(getExternalMapModels(sourceType));
  let createTypes = loKeys(getAllowedToCreateModels(sourceType));

  let canCreateOrMap = loIncludes(mappableTypes, targetType) ||
    loIncludes(createTypes, targetType) ||
    loIncludes(externalTypes, targetType);

  return canCreateOrMap && userHasPermissions(source, target);
}

/**
 * Determine if `target` is allowed to be unmapped from `source`.
 *
 * @param {Object} source - the source object the mapping
 * @param {Object} target - the target object of the mapping
 *
 * @return {Boolean} - true if unmapping is allowed, false otherwise
 */
function allowedToUnmap(source, target) {
  let sourceType = _getType(source);
  let targetType = _getType(target);

  let unmappableTypes = loKeys(getAllowedToUnmapModels(sourceType));
  let canUnmap = loIncludes(unmappableTypes, targetType);

  return canUnmap && userHasPermissions(source, target);
}

function _getType(object) {
  let type;

  if (object instanceof canModel) {
    type = object.constructor.model_singular;
  } else {
    type = object.type || object;
  }

  if (type === 'Snapshot') {
    type = object.child_type; // check Snapshot original object type
  }

  return type;
}

/**
 * Returns the list of allowed direct mapping models
 * with possible related mapping models
 * @param {String} type - base model type
 * @return {Array} - list of available mappings
 */
function getAvailableMappings(type) {
  let allowedToMap = getAllowedToMapModels(type);
  let related = getIndirectlyMappedModels(type);
  let externalMap = getExternalMapModels(type);
  let allowedToCreate = getAllowedToCreateModels(type);

  return Object.assign({},
    allowedToMap, related, externalMap, allowedToCreate);
}

/*
  return all allowed mappings (suitable for joining) for an object type.
  object - a string representing the object type's shortName

  return: a keyed object of all mappings (instances of Cacheable)
*/
function getAllowedToMapModels(object) {
  return _getModelsFromConfig(object, 'map');
}

/**
 * Returns collection of models allowed for unmapping
 * @param {String} object - the object type's shortName
 * @return {Object} a keyed object of allowed for unmapping models
 */
function getAllowedToUnmapModels(object) {
  return _getModelsFromConfig(object, 'unmap');
}

/**
 * Returns collection of models allowed for creating and mapping
 * @param {String} object - the object type's short name
 * @return {Object} - a keyed object of allowed for creating and mapping models
 */
function getAllowedToCreateModels(object) {
  return _getModelsFromConfig(object, 'create');
}

function _getModelsFromConfig(object, prop) {
  let mappings = {};
  if (config[object] && config[object][prop]) {
    loForEach(config[object][prop],
      (model) => {
        mappings[model] = businessModels[model];
      });
  }
  return mappings;
}

/*
  return all possible indirectly mapped models for an object type.
  object - a string representing the object type's shortName

  return: a keyed object of all related mappings (instances of Cacheable)
*/
function getIndirectlyMappedModels(object) {
  return _getModelsFromConfig(object, 'indirectMappings');
}

/**
 * Returns object with models which can be mapped externally only
 * @param {string} object model name
 * @return {Object} allowed for external mapping models
 */
function getExternalMapModels(object) {
  return _getModelsFromConfig(object, 'externalMap');
}

function shouldBeMappedExternally(source, destination) {
  let externalMappings = getExternalMapModels(source);
  return loKeys(externalMappings).includes(destination);
}

export {
  getMappingList,
  allowedToCreate,
  allowedToMap,
  allowedToCreateOrMap,
  allowedToUnmap,
  getAllowedToUnmapModels,
  getAvailableMappings,
  shouldBeMappedExternally,
};

