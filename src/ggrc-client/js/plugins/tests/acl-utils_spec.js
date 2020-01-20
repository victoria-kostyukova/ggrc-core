/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import makeArray from 'can-util/js/make-array/make-array';
import {
  peopleWithRoleName,
} from '../../plugins/utils/acl-utils';
import {makeFakeInstance} from '../../../js_specs/spec-helpers';
import Audit from '../../models/business-models/audit';
import Policy from '../../models/business-models/policy';

describe('ACL utils peopleWithRoleName() method', () => {
  let origRoleList;
  let acl;
  let instance;

  beforeAll(() => {
    origRoleList = GGRC.access_control_roles;
    GGRC.access_control_roles = [
      {id: 5, name: 'Role A', object_type: 'Market'},
      {id: 9, name: 'Role A', object_type: 'Audit'},
      {id: 1, name: 'Role B', object_type: 'Market'},
      {id: 7, name: 'Role A', object_type: 'Policy'},
      {id: 3, name: 'Role B', object_type: 'Audit'},
      {id: 2, name: 'Role B', object_type: 'Policy'},
    ];
    acl = [
      {person: {id: 3}, ac_role_id: 1},
      {person: {id: 5}, ac_role_id: 3},
      {person: {id: 6}, ac_role_id: 9},
      {person: {id: 2}, ac_role_id: 3},
      {person: {id: 7}, ac_role_id: 9},
      {person: {id: 5}, ac_role_id: 2},
      {person: {id: 9}, ac_role_id: 9},
    ];
  });

  afterAll(() => {
    GGRC.access_control_roles = origRoleList;
  });

  it('returns users that have a role granted on a particular instance', () => {
    instance = makeFakeInstance({model: Audit})({
      id: 42,
      type: 'Audit',
      access_control_list: acl,
    });

    const result = peopleWithRoleName(instance, 'Role B');
    expect(makeArray(result.map((person) => person.id).sort()))
      .toEqual([2, 5]);
  });

  it('returns empty array if role name not found', () => {
    instance = makeFakeInstance({model: Audit})({
      id: 42,
      type: 'Audit',
      access_control_list: acl,
    });

    const result = peopleWithRoleName(instance, 'Role X');
    expect(makeArray(result)).toEqual([]);
  });

  it('returns empty array if no users are granted a particular role', () => {
    instance = makeFakeInstance({model: Policy})({
      id: 43,
      type: 'Policy',
      access_control_list: acl,
    });

    let result = peopleWithRoleName(instance, 'Role A');

    expect(makeArray(result)).toEqual([]);
  });
});
