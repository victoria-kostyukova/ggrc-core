/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loForEach from 'lodash/forEach';
import * as QueryAPI from './query-api-utils';
import {getRolesForType} from '../utils/acl-utils';

async function loadComments(relevantObject, modelName,
  startIndex = 0, count = 10) {
  let query = buildQuery(relevantObject, modelName, startIndex, count);

  return QueryAPI.batchRequests(query);
}

function buildQuery(relevantObject, modelName, startIndex, count) {
  return QueryAPI.buildParam(modelName, {
    first: startIndex,
    last: startIndex + count,
    sort: [{
      key: 'created_at',
      direction: 'desc',
    }]}, {
    type: relevantObject.type,
    id: relevantObject.id,
    operation: 'relevant',
  });
}

/**
 * Capitalizes first character
 * @param {String} type - Any comment author role
 * @return {String} type - String with first letter being capitalized
 */
function capitalizeFirst(type) {
  return type
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Orders Assessment roles based on defined hierarchy
 * @param {Object} instance - Object instance
 * @param {Array} assigneeRoles - Array of assessment assignee roles
 * @return {Array}  Ordered default roles and custom roles
 */
function orderRolesByHierarchy(instance, assigneeRoles) {
  if (! instance.constructor.assigneeHierarchy) {
    return assigneeRoles;
  }
  assigneeRoles.sort(function (roleA, roleB) {
    let orderA = instance.constructor.assigneeHierarchy[roleA];
    let orderB = instance.constructor.assigneeHierarchy[roleB];
    let ret;

    if (orderA && !orderB) {
      ret = -1;
    } else if (orderB && !orderA) {
      ret = 1;
    } else if (orderA && orderB) {
      ret = orderA - orderB;
    } else {
      ret = 0;
    }

    return (ret);
  });

  return assigneeRoles;
}

/**
 * Orders Assessment roles based on defined hierarchy
 * @param {Object} instance - Object instance
 * @param {Array} assigneeRoles - UserRoles Array
 * @return {Array} Reduces custom roles to 'Custom Role'
 */
function reduceCustomUserRoles(instance, assigneeRoles) {
  if (! instance.constructor.assigneeHierarchy) {
    return assigneeRoles;
  }
  let userRoles = [];
  let instanceAssigneeRoles = Object.keys(
    instance.constructor.assigneeHierarchy);

  if (assigneeRoles[0] === '') {
    return userRoles;
  }
  for (let i = 0; i < instanceAssigneeRoles.length; i++) {
    if (assigneeRoles.includes(instanceAssigneeRoles[i])) {
      let removed = assigneeRoles.splice(0, 1);
      userRoles.push(removed[0]);
    }
  }
  if (assigneeRoles.length > 0) {
    userRoles.push('Custom Role');
  }
  return userRoles;
}

/**
 * Fetches Comment's highest author role based on defined hierarchy
 * @param {Object} baseInstance - Base Object instance
 * @param {String} userRolesString - UserRoles string
 * @return {String} returns comment author role
 */
function getCommentAuthorRole(baseInstance, userRolesString) {
  if (!userRolesString) {
    return '';
  }
  let userRoles = userRolesString.split(',');
  userRoles = orderRolesByHierarchy(baseInstance, userRoles);
  let assignees = reduceCustomUserRoles(baseInstance, userRoles);
  let assignee = assignees[0] ? assignees[0].trim() : '';

  return assignee ? `(${capitalizeFirst(assignee)})` : '';
}

/**
 * Build string of assignees types separated by commas.
 * @param {Object} instance - Object instance
 * @return {String} assignees types separated by commas
 */
function getAssigneeType(instance) {
  let currentUser = GGRC.current_user;
  let roles = getRolesForType(instance.type);
  let userRoles = null;

  loForEach(roles, function (role) {
    let aclPerson = instance
      .access_control_list
      .filter((item) => item.ac_role_id === role.id &&
        item.person.id == currentUser.id); // eslint-disable-line

    if (!aclPerson.length) {
      return;
    }

    userRoles = userRoles ? userRoles + ',' + role.name : role.name;
  });

  return userRoles;
}

export {
  loadComments,
  getAssigneeType,
  getCommentAuthorRole,
};
