/*
 Copyright (C) 2018 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {
  isSnapshot,
  isSnapshotModel,
  isSnapshotRelated,
  isSnapshotScope,
  toObject,
  transformQuery,
} from './snapshot-utils';
import {
  related,
  initMappedInstances,
  isObjectContextPage,
  getPageType,
  isMyWork,
} from './current-page-utils';
import {
  buildParam,
  batchRequests,
  buildCountParams,
} from './query-api-utils';
import {
  parentHasObjectVersions,
  getWidgetConfigs,
  getWidgetConfig,
} from './object-versions-utils';
import {getRolesForType} from './acl-utils';
import {getMappableTypes} from '../ggrc_utils';
import {caDefTypeName} from './custom-attribute/custom-attribute-config';
import Cacheable from '../../models/cacheable';
import * as businessModels from '../../models/business-models';

/**
* TreeView-specific utils.
*/

let baseWidgets = GGRC.tree_view.attr('base_widgets_by_type');
let defaultOrderTypes = GGRC.tree_view.attr('defaultOrderTypes');
let allTypes = Object.keys(baseWidgets.attr());
let orderedModelsForSubTier = {};


let SUB_TREE_ELEMENTS_LIMIT = 20;
let SUB_TREE_FIELDS = Object.freeze([
  'child_id',
  'child_type',
  'context',
  'email',
  'id',
  'is_latest_revision',
  'name',
  'revision',
  'revisions',
  'selfLink',
  'slug',
  'status',
  'title',
  'type',
  'viewLink',
  'workflow_state',
  'archived',
  // label for Audit
  'program',
  // labels for assessment templates
  'DEFAULT_PEOPLE_LABELS',
  'user_roles',
]);

let FULL_SUB_LEVEL_LIST = Object.freeze([
  'Cycle',
  'CycleTaskGroup',
  'CycleTaskGroupObjectTask',
]);

let NO_FIELDS_LIMIT_LIST = Object.freeze([
  'Assessment',
]);

const DEFAULT_SORT_KEY = 'updated_at';
const DEFAULT_SORT_DIRECTION = 'desc';
const NO_DEFAULT_SORTING_LIST = Object.freeze([
  'Cycle',
  'TaskGroup',
  'TaskGroupTask',
  'CycleTaskGroupObjectTask',
]);

allTypes.forEach(function (type) {
  let related = baseWidgets[type].slice(0);

  orderedModelsForSubTier[type] = _.chain(related)
    .map(function (type) {
      return {
        name: type,
        order: defaultOrderTypes[type],
      };
    })
    .sortBy(['order', 'name'])
    .map('name')
    .value();
});

// Define specific rules for Workflow models
orderedModelsForSubTier.Cycle = ['CycleTaskGroup'];
orderedModelsForSubTier.CycleTaskGroup = ['CycleTaskGroupObjectTask'];
orderedModelsForSubTier.CycleTaskGroupObjectTask = [];

function getSubTreeFields(parent, child) {
  let noFieldsLimitOnChild = hasNoFieldsLimit(child);
  let noFieldsLimitOnParent = _isFullSubTree(parent);
  return noFieldsLimitOnChild || noFieldsLimitOnParent ?
    [] :
    SUB_TREE_FIELDS;
}

function hasNoFieldsLimit(type) {
  return NO_FIELDS_LIMIT_LIST.indexOf(type) > -1;
}

/**
 * Get available and selected columns for Model type
 * @param {String} modelType - Model type.
 * @param {Object} displayPrefs - Display preferences.
 * @param {String} modelName - Model name.
 * @return {Object} Table columns configuration.
 */
function getColumnsForModel(modelType, displayPrefs, modelName) {
  let Model = businessModels[modelType];
  let modelDefinition = Model.root_object;
  let mandatoryAttrNames =
    Model.tree_view_options.mandatory_attr_names ||
    Cacheable.tree_view_options.mandatory_attr_names;
  let savedAttrList = displayPrefs ?
    displayPrefs.getTreeViewHeaders(modelName || Model.model_singular) :
    [];
  let displayAttrNames =
    savedAttrList.length ? savedAttrList :
      (Model.tree_view_options.display_attr_names ||
      Cacheable.tree_view_options.display_attr_names);
  let disableConfiguration =
    !!Model.tree_view_options.disable_columns_configuration;
  let mandatoryColumns;
  let displayColumns;
  let attrs;
  let customAttrs;
  let allAttrs;
  let modelRoles;
  let roleAttrs;

  attrs = can.makeArray(
    Model.tree_view_options.mapper_attr_list ||
    Model.tree_view_options.attr_list ||
    Cacheable.attr_list
  ).filter(function (attr) {
    return !attr.deny;
  }).map(function (attr) {
    attr = _.assign({}, attr);
    if (!attr.attr_sort_field) {
      attr.attr_sort_field = attr.attr_name;
    }
    return attr;
  }).sort(function (a, b) {
    if (a.order && !b.order) {
      return -1;
    } else if (!a.order && b.order) {
      return 1;
    }
    return a.order - b.order;
  });

  // add custom attributes information
  customAttrs = disableConfiguration ?
    [] :
    GGRC.custom_attr_defs
      .filter(function (def) {
        let include = def.definition_type === modelDefinition;

        return include;
      }).map(function (def) {
        let disableSorting = def.attribute_type === caDefTypeName.RichText;

        return {
          attr_title: def.title,
          attr_custom_attribute_id: def.id,
          attr_name: def.title,
          attr_sort_field: def.title,
          display_status: false,
          attr_type: 'custom',
          disable_sorting: disableSorting,
        };
      });
  allAttrs = attrs.concat(customAttrs);

  // add custom roles information
  modelRoles = getRolesForType(modelType);
  roleAttrs = modelRoles.map(function (role) {
    return {
      attr_title: role.name,
      attr_name: role.name,
      attr_sort_field: role.name,
      display_status: false,
      attr_type: 'role',
    };
  });
  allAttrs = allAttrs.concat(roleAttrs);

  if (disableConfiguration) {
    return {
      available: allAttrs,
      selected: allAttrs,
      disableConfiguration: true,
    };
  }

  displayAttrNames = displayAttrNames.concat(mandatoryAttrNames);

  allAttrs.forEach(function (attr) {
    attr.display_status = displayAttrNames.indexOf(attr.attr_name) !== -1;
    attr.mandatory = mandatoryAttrNames.indexOf(attr.attr_name) !== -1;
  });

  mandatoryColumns = allAttrs.filter(function (attr) {
    return attr.mandatory;
  });

  displayColumns = allAttrs.filter(function (attr) {
    return attr.display_status && !attr.mandatory;
  });

  return {
    available: allAttrs,
    selected: mandatoryColumns.concat(displayColumns),
    mandatory: mandatoryAttrNames,
    disableConfiguration: false,
  };
}

/**
 * Set selected columns for Model type
 * @param {String} modelType - Model type.
 * @param {Array} columnNames - Array of column names.
 * @param {Object} displayPrefs - Display preferences.
 * @param {String} modelName - Model name.
 * @return {Object} Table columns configuration.
 */
function setColumnsForModel(modelType, columnNames, displayPrefs,
  modelName) {
  let availableColumns =
    getColumnsForModel(modelType, displayPrefs).available;
  let selectedColumns = [];
  let selectedNames = [];

  availableColumns.forEach(function (attr) {
    if (columnNames.indexOf(attr.attr_name) !== -1) {
      attr.display_status = true;
      selectedColumns.push(attr);
      if (!attr.mandatory) {
        selectedNames.push(attr.attr_name);
      }
    } else {
      attr.display_status = false;
    }
  });

  if (displayPrefs) {
    displayPrefs.setTreeViewHeaders(
      modelName || businessModels[modelType].model_singular,
      selectedNames
    );
    displayPrefs.save();
  }

  return {
    available: availableColumns,
    selected: selectedColumns,
  };
}

/**
 * Returns array of columns configs.
 * Each config contains 'name', 'title', 'mandatory', 'selected' properties
 * @param {Array} available - Full list of available columns.
 * @param {Array} selected - List of selected columns.
 * @return {Array} Array of columns configs.
 */
function getVisibleColumnsConfig(available, selected) {
  const selectedColumns = can.makeArray(selected);
  const availableColumns = can.makeArray(available);
  const columns = [];

  availableColumns.forEach(function (attr) {
    const isSelected = selectedColumns
      .some((selectedAttr) => selectedAttr.attr_name === attr.attr_name);
    columns.push(new can.Map({
      title: attr.attr_title,
      name: attr.attr_name,
      mandatory: attr.mandatory,
      selected: isSelected,
    }));
  });

  return columns;
}

/**
 * Get sorting configuration for Model type
 * @param {String} modelType - Model type.
 * @return {Object} sorting configuration.
 */
function getSortingForModel(modelType) {
  let key = DEFAULT_SORT_KEY;
  let direction = DEFAULT_SORT_DIRECTION;

  if (NO_DEFAULT_SORTING_LIST.indexOf(modelType) !== -1) {
    key = null;
    direction = null;
  }

  return {
    key,
    direction,
  };
}

/**
 * Get available and selected models for the Model sub tier
 * @param {String} modelName - Model name.
 * @return {Object} Sub tier filter configuration.
 */
function getModelsForSubTier(modelName) {
  let Model = businessModels[modelName];
  let availableModels;
  let selectedModels;

  // getMappableTypes can't be run at once,
  // cause Mappings is not loaded yet
  if (modelName === 'CycleTaskGroupObjectTask' &&
  !orderedModelsForSubTier[modelName].length) {
    orderedModelsForSubTier[modelName] =
    getMappableTypes('CycleTaskGroupObjectTask');
  }

  availableModels = orderedModelsForSubTier[modelName] || [];

  if (Model.sub_tree_view_options.default_filter) {
    selectedModels = Model.sub_tree_view_options.default_filter;
  } else {
    selectedModels = availableModels;
  }

  return {
    available: availableModels,
    selected: selectedModels,
  };
}

/**
 *
 * @param {String} modelName - Name of requested objects.
 * @param {Object} parent - Information about parent object.
 * @param {String} parent.type - Type of parent object.
 * @param {Number} parent.id - ID of parent object.
 * @param {Object} pageInfo - Information about pagination, sorting and filtering
 * @param {Number} pageInfo.current -
 * @param {Number} pageInfo.pageSize -
 * @param {Number} pageInfo.sortBy -
 * @param {Number} pageInfo.sortDirection -
 * @param {Object} filter -
 * @param {Object} request - Collection of QueryAPI sub-requests
 * @param {Boolean} transformToSnapshot - Transform query to Snapshot
 * @return {Promise} Deferred Object
 */
function loadFirstTierItems(modelName,
  parent,
  pageInfo,
  filter,
  request,
  transformToSnapshot) {
  let params = buildParam(
    modelName,
    pageInfo,
    makeRelevantExpression(modelName, parent.type, parent.id),
    null,
    filter
  );
  let requestedType;
  let requestData = request.slice() || can.List();

  if (transformToSnapshot ||
    (isSnapshotScope(parent) && isSnapshotModel(modelName))) {
    params = transformQuery(params);
  }

  requestedType = params.object_name;
  requestData.push(params);
  return $.when(...requestData.attr().map((el) => batchRequests(el)))
    .then((...response) => {
      response = _.last(response)[requestedType];

      response.values = response.values.map(function (source) {
        return _createInstance(source, modelName);
      });

      return response;
    });
}

/**
 *
 * @param {Array} models - Array of models for load in sub tree
 * @param {String} type - Type of parent object.
 * @param {Number} id - ID of parent object.
 * @param {String} filter - Filter.
 * @return {Promise} - Items for sub tier.
 */
function loadItemsForSubTier(models, type, id, filter) {
  let relevant = {
    type: type,
    id: id,
    operation: 'relevant',
  };
  let showMore = false;
  let loadedModelObjects = [];

  return _buildSubTreeCountMap(models, relevant, filter)
    .then(function (result) {
      let countMap = result.countsMap;
      let dfds;
      let mappedDfd;
      let resultDfd;

      loadedModelObjects = getWidgetConfigs(Object.keys(countMap));
      showMore = result.showMore;

      dfds = loadedModelObjects.map(function (modelObject) {
        let subTreeFields = getSubTreeFields(type, modelObject.name);
        let pageInfo = {};
        let params;

        if (countMap[modelObject.name]) {
          pageInfo.current = 1;
          pageInfo.pageSize = countMap[modelObject.name];
        }
        params = buildParam(
          modelObject.name,
          pageInfo,
          relevant,
          subTreeFields,
          filter
        );

        if (isSnapshotRelated(relevant.type, params.object_name) ||
          modelObject.isObjectVersion) {
          params = transformQuery(params);
        }

        return batchRequests(params);
      });

      resultDfd = can.when(...dfds).promise();

      if (!related.initialized) {
        mappedDfd = initMappedInstances();

        return can.when(mappedDfd, dfds).then(function () {
          return resultDfd;
        });
      }

      return resultDfd;
    })
    .then(function () {
      let directlyRelated = [];
      let notRelated = [];
      let response = can.makeArray(arguments);

      loadedModelObjects.forEach(function (modelObject, index) {
        let values;

        if (isSnapshotModel(modelObject.name) &&
          response[index].Snapshot) {
          values = response[index].Snapshot.values;
        } else {
          values = response[index][modelObject.name].values;
        }

        values.forEach(function (source) {
          let instance = _createInstance(source, modelObject.name);

          if (isDirectlyRelated(instance)) {
            directlyRelated.push(instance);
          } else {
            notRelated.push(instance);
          }
        });
      });

      return {
        directlyItems: directlyRelated,
        notDirectlyItems: notRelated,
        showMore: showMore,
      };
    });
}

/**
 *
 * @param {String} requestedType - Type of requested object.
 * @param {String} relevantToType - Type of parent object.
 * @param {Number} relevantToId - ID of parent object.
 * @param {String} [operation] - Type of operation
 * @return {object} Returns expression for load items for 1st level of tree view.
 */
function makeRelevantExpression(requestedType,
  relevantToType,
  relevantToId,
  operation) {
  let isObjectBrowser = /^\/objectBrowser\/?$/
    .test(window.location.pathname);
  let expression;

  if (!isObjectBrowser) {
    expression = {
      type: relevantToType,
      id: relevantToId,
    };

    expression.operation = operation ? operation :
      _getTreeViewOperation(requestedType, relevantToType);
  }
  return expression;
}

/**
 * Check if object directly mapped to the current context.
 * @param {Object} instance - Instance of model.
 * @private
 * @return {Boolean} Is associated with the current context.
 */
function isDirectlyRelated(instance) {
  let needToSplit = isObjectContextPage() &&
    getPageType() !== 'Workflow';
  let relates = related.attr(instance.type);
  let result = true;
  let instanceId = isSnapshot(instance) ?
    instance.snapshot.id :
    instance.id;

  if (needToSplit) {
    result = !!(relates && relates[instanceId]);
  }

  return result;
}

/**
 *
 * @param {Array} models - Type of model.
 * @param {Object} relevant - Relevant description
 * @param {String} filter - Filter string.
 * @return {Array} - List of queries
 * @private
 */
function _getQuerryObjectVersion(models, relevant, filter) {
  let countQuery = [];
  models.forEach(function (model) {
    let widgetConfig = getWidgetConfig(model);
    let name = widgetConfig.name;
    let query = buildCountParams([name], relevant, filter);

    if (widgetConfig.isObjectVersion) {
      query = transformQuery(query[0]);
      countQuery.push(query);
    } else {
      countQuery.push(query[0]);
    }
  });

  return countQuery;
}

/**
 *
 * @param {Array} models - Type of model.
 * @param {Object} relevant - Relevant description
 * @param {String} filter - Filter string.
 * @return {Promise} - Counts for limitation load items for sub tier
 * @private
 */
function _buildSubTreeCountMap(models, relevant, filter) {
  let countQuery;
  let result;
  let countMap = {};

  if (_isFullSubTree(relevant.type)) {
    models.forEach(function (model) {
      countMap[model] = false;
    });
    result = can.Deferred().resolve({
      countsMap: countMap,
      showMore: false,
    });
  } else {
    if (parentHasObjectVersions(relevant.type)) {
      countQuery = _getQuerryObjectVersion(models, relevant, filter);
    } else {
      countQuery = buildCountParams(models, relevant, filter)
        .map(function (param) {
          if (isSnapshotRelated(
            relevant.type,
            param.object_name)) {
            param = transformQuery(param);
          }
          return param;
        });
    }

    result = can.when(...countQuery.map((query) => batchRequests(query)))
      .then((...response) => {
        let total = 0;
        let showMore = models.some(function (model, index) {
          let count = response[index][model] ?
            response[index][model].total :
            response[index].Snapshot.total;

          if (!count) {
            return false;
          }

          if (total + count < SUB_TREE_ELEMENTS_LIMIT) {
            countMap[model] = count;
          } else {
            countMap[model] = SUB_TREE_ELEMENTS_LIMIT - total;
          }

          total += count;

          return total >= SUB_TREE_ELEMENTS_LIMIT;
        });

        return {
          countsMap: countMap,
          showMore: showMore,
        };
      });
  }

  return result;
}

function _isFullSubTree(type) {
  return FULL_SUB_LEVEL_LIST.indexOf(type) >= 0;
}

/**
 * @param {Object} source - Instance object.
 * @param {String} modelName - Name of model.
 * @return {Cacheable} - Instance of model.
 * @private
 */
function _createInstance(source, modelName) {
  let instance;

  if (source.type === 'Snapshot') {
    instance = toObject(source);
  } else {
    instance = businessModels[modelName].model(source);
  }
  return instance;
}

function _getTreeViewOperation(objectName, relevantToType) {
  let isDashboard = isMyWork();

  if (!isDashboard && objectName === 'Person') {
    return 'related_people';
  }
  if (isDashboard) {
    return 'owned';
  }
  if (objectName === 'Evidence' && relevantToType === 'Audit') {
    return 'related_evidence';
  }
}

export {
  getColumnsForModel,
  setColumnsForModel,
  getSortingForModel,
  getModelsForSubTier,
  loadFirstTierItems,
  loadItemsForSubTier,
  makeRelevantExpression,
  getVisibleColumnsConfig,
  isDirectlyRelated,
};
