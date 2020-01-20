/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {exists} from './plugins/ggrc-utils';
import loToArray from 'lodash/toArray';
import loReduce from 'lodash/reduce';
import {ggrcAjax} from './plugins/ajax-extensions';
import canCompute from 'can-compute';
import './plugins/utils/current-page-utils'; // fixes a cyclic dependency and should be fixed in a proper way
import Stub from '../js/models/stub';
import {getInstance} from '../js/plugins/utils/models-utils';
import {reify} from '../js/plugins/utils/reify-utils';

let _CONDITIONS_MAP = {
  contains: function (instance, args) {
    let value = _resolvePermissionVariable(args.value);
    let listValue = instance[args.list_property] || [];
    let i;
    for (i = 0; i < listValue.length; i++) {
      if (listValue[i].id === value.id) {
        return true;
      }
    }
    return false;
  },
  is: function (instance, args) {
    let value = _resolvePermissionVariable(args.value);
    let propertyValue = loReduce(args.property_name.split('.'),
      function (obj, key) {
        let value = obj.attr(key);
        if (value instanceof Stub) {
          value = reify(value);
        }
        return value;
      }, instance);
    return value === propertyValue;
  },
  'in': function (instance, args) {
    let value = _resolvePermissionVariable(args.value);
    let propertyValue = instance[args.property_name];
    if (propertyValue instanceof Stub) {
      propertyValue = reify(propertyValue);
    }
    return value.indexOf(propertyValue) >= 0;
  },
  forbid: function (instance, args, action) {
    let blacklist = args.blacklist[action] || [];
    return blacklist.indexOf(instance.type) < 0;
  },
  has_changed: function (instance, args) {
    return (instance.attr(args.property_name) === args.prevent_if);
  },
  has_not_changed: function (instance, args) {
    return !(instance.attr(args.property_name) === args.prevent_if);
  },
};
let permissionsCompute = canCompute(GGRC.permissions);

class Permission {
  constructor(action, resourceType, contextId) {
    this.action = action;
    this.resource_type = resourceType;
    this.context_id = contextId;
  }
}

const ADMIN_PERMISSION = new Permission('__GGRC_ADMIN__', '__GGRC_ALL__', 0);

function _adminPermissionForContext(contextId) { // eslint-disable-line id-length
  return new Permission(
    ADMIN_PERMISSION.action, ADMIN_PERMISSION.resource_type, contextId);
}

function _allResourcePermission(permission) {
  return new Permission(
    permission.action, ADMIN_PERMISSION.resource_type, permission.context_id);
}

function _permissionMatch(permissions, permission) {
  let resourceTypes = permissions[permission.action] || {};
  let resourceType = resourceTypes[permission.resource_type] || {};
  let contexts = resourceType.contexts || [];

  return (contexts.indexOf(permission.context_id) > -1);
}

function _isAllowed(permissions, permission) {
  if (!permissions) {
    return false;
  }
  if (_permissionMatch(
    permissions,
    new Permission(
      permission.action,
      permission.resource_type, null))) {
    return true;
  }
  if (_permissionMatch(permissions, permission)) {
    return true;
  }
  if (_permissionMatch(permissions,
    _allResourcePermission(permission))) {
    return true;
  }
  if (_permissionMatch(permissions, ADMIN_PERMISSION)) {
    return true;
  }
  if (_permissionMatch(permissions,
    _adminPermissionForContext(permission.context_id))) {
    return true;
  }
  // Check for System Admin permission
  if (_permissionMatch(permissions,
    _adminPermissionForContext(0))) {
    return true;
  }
  return false;
}

function _resolvePermissionVariable(value) { // eslint-disable-line id-length
  if ($.type(value) === 'string') {
    if (value[0] === '$') {
      if (value === '$current_user') {
        return getInstance('Person', GGRC.current_user.id);
      }
      throw new Error('unknown permission variable: ' + value);
    }
  }
  return value;
}

function _isAllowedFor(permissions, instance, action) {
  // Check for admin permission
  let checkAdmin = function (contextId) {
    let permission = _adminPermissionForContext(contextId);
    let conditions;
    let i;
    let condition;
    if (_permissionMatch(permissions, permission)) {
      conditions = loToArray(exists(permissions,
        permission.action,
        permission.resource_type,
        'conditions',
        contextId));
      if (!conditions.length) {
        return true;
      }
      for (i = 0; i < conditions.length; i++) {
        condition = conditions[i];
        if (_CONDITIONS_MAP[condition.condition](
          instance, condition.terms, action)) {
          return true;
        }
      }
      return false;
    }
    return false;
  };

  let actionObj = permissions[action] || {};
  let shortName = instance.constructor && instance.constructor.model_singular;
  let instanceType = instance.type || shortName;
  let typeObj = actionObj[instanceType] || {};
  let conditionsByContext = typeObj.conditions || {};
  let resources = typeObj.resources || [];
  let context = instance.context || {id: null};
  let conditions = conditionsByContext[context.id] || [];
  let condition;
  let i;

  conditions = conditions.concat(conditionsByContext.null || []);

  if (checkAdmin(0) || checkAdmin(null)) {
    return true;
  }
  if (~resources.indexOf(instance.id)) {
    return true;
  }
  if (conditions.length === 0 && (_isAllowed(permissions,
    new Permission(action, instanceType, null)) ||
    _isAllowed(permissions,
      new Permission(action, instanceType, context.id)))) {
    return true;
  }
  // Check any conditions applied per instance
  // If there are no conditions, the user has unconditional access to
  // the current instance. We can safely return true in this case.
  if (conditions.length === 0) {
    return false;
  }
  for (i = 0; i < conditions.length; i++) {
    condition = conditions[i];
    if (_CONDITIONS_MAP[condition.condition](
      instance, condition.terms, action)) {
      return true;
    }
  }
  return false;
}

function isAllowed(action, resourceType, contextId) {
  return _isAllowed(
    permissionsCompute(), new Permission(action, resourceType, contextId));
}

function isAllowedFor(action, resource) {
  return _isAllowedFor(permissionsCompute(), resource, action);
}

function isAllowedAny(action, resourceType) {
  let allowed = isAllowed(action, resourceType);
  let perms = permissionsCompute();

  if (!allowed) {
    allowed = exists(perms, action, resourceType, 'contexts', 'length');
  }
  return !!allowed;
}

function refreshPermissions() {
  return ggrcAjax({
    url: '/permissions',
    type: 'get',
    dataType: 'json',
  }).then(function (perm) {
    permissionsCompute(perm);
    GGRC.permissions = perm;
  });
}

export {
  _adminPermissionForContext,
  _allResourcePermission,
  _permissionMatch,
  _isAllowed,
  _resolvePermissionVariable,
  _isAllowedFor,
  isAllowed,
  isAllowedFor,
  isAllowedAny,
  refreshPermissions,
};
