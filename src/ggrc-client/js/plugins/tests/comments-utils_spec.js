/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import * as aclUtils from '../utils/acl-utils';
import {
  getAssigneeType,
  getCommentAuthorRole,
} from '../utils/comments-utils';

describe('getCommentAuthorRole() method', function () {
  let asstInstance;
  let progInstance;

  beforeEach(function () {
    asstInstance = {
      type: 'Assessment',
      id: 2147483647,
      access_control_list: [],
      constructor: {
        assigneeHierarchy: {
          Verifiers: 1,
          Assignees: 2,
          Creators: 3,
          'Primary Contacts': 4,
          'Secondary Contacts': 5,
        },
      },
    };
    progInstance = {
      type: 'Program',
      id: 6736132723,
      access_control_list: [],
    };
  });

  it('should return an empty string' +
  'if there are no assignee in comment', function () {
    let roles = '';
    let assignee = getCommentAuthorRole(asstInstance, roles);
    expect(assignee).toEqual('');
  });

  it('should return first role from the list' +
  'when roles hierarchy is not set', function () {
    let roles = 'Program Managers,Program Editors';
    let assignee = getCommentAuthorRole(progInstance, roles);
    expect(assignee).toEqual('(Program Managers)');
  });

  it('should return first role by hierarchy from the list', function () {
    let roles = 'Creators,Assignees,Verifiers';
    let assignee = getCommentAuthorRole(asstInstance, roles);
    expect(assignee).toEqual('(Verifiers)');
  });

  it('should return Custom Role instead of custom role name', function () {
    let roles = 'RandomRole';
    let assignee = getCommentAuthorRole(asstInstance, roles);
    expect(assignee).toEqual('(Custom Role)');
  });
});

describe('getAssigneeType() method', function () {
  let instance;

  beforeEach(function () {
    instance = {
      type: 'Assessment',
      id: 2147483647,
      access_control_list: [],
    };

    spyOn(aclUtils, 'getRolesForType').and.returnValue([
      {
        id: 1, object_type: 'Assessment', name: 'Admin',
      },
      {
        id: 3, object_type: 'Assessment', name: 'Verifiers',
      },
      {
        id: 4, object_type: 'Assessment', name: 'Creators',
      },
      {
        id: 5, object_type: 'Assessment', name: 'Assignees',
      },
    ]);
  });

  it('should return null. Empty ACL', function () {
    let userType = getAssigneeType(instance);
    expect(userType).toBeNull();
  });

  it('should return null. User is not in role', function () {
    let userType;
    instance.access_control_list = [
      {ac_role_id: 3, person: {id: 4}},
      {ac_role_id: 1, person: {id: 5}},
    ];

    userType = getAssigneeType(instance);
    expect(userType).toBeNull();
  });

  it('should return Verifiers type', function () {
    let userType;
    instance.access_control_list = [
      {ac_role_id: 3, person: {id: 1}},
      {ac_role_id: 1, person: {id: 3}},
    ];

    userType = getAssigneeType(instance);
    expect(userType).toEqual('Verifiers');
  });

  it('should return Verifiers and Creators types', function () {
    let userType;
    instance.access_control_list = [
      {ac_role_id: 3, person: {id: 1}},
      {ac_role_id: 1, person: {id: 3}},
      {ac_role_id: 4, person: {id: 1}},
      {ac_role_id: 3, person: {id: 5}},
    ];

    userType = getAssigneeType(instance);
    expect(userType.indexOf('Verifiers') > -1).toBeTruthy();
    expect(userType.indexOf('Creators') > -1).toBeTruthy();
  });

  it('should return Verifiers and Creators and Assigness types', function () {
    let userType;
    instance.access_control_list = [
      {ac_role_id: 3, person: {id: 1}},
      {ac_role_id: 1, person: {id: 3}},
      {ac_role_id: 4, person: {id: 1}},
      {ac_role_id: 3, person: {id: 5}},
      {ac_role_id: 5, person: {id: 1}},
    ];

    userType = getAssigneeType(instance);
    expect(userType.indexOf('Verifiers') > -1).toBeTruthy();
    expect(userType.indexOf('Creators') > -1).toBeTruthy();
    expect(userType.indexOf('Assignees') > -1).toBeTruthy();
  });

  it('should return string with types separated by commas', function () {
    let userType;
    let expectedString = 'Verifiers,Creators,Assignees';
    instance.access_control_list = [
      {ac_role_id: 3, person: {id: 1}},
      {ac_role_id: 1, person: {id: 3}},
      {ac_role_id: 4, person: {id: 1}},
      {ac_role_id: 3, person: {id: 5}},
      {ac_role_id: 5, person: {id: 1}},
    ];

    userType = getAssigneeType(instance);
    expect(userType).toEqual(expectedString);
  });
});
