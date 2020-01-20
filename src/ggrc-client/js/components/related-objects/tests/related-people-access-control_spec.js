/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import Component from '../related-people-access-control';
import {getComponentVM, makeFakeInstance} from '../../../../js_specs/spec-helpers';
import * as aclUtils from '../../../plugins/utils/acl-utils';
import Control from '../../../models/business-models/control';

describe('related-people-access-control component', function () {
  let viewModel;

  beforeAll(function () {
    viewModel = getComponentVM(Component);
  });

  describe('"updateRoles" method', () => {
    let args;

    beforeEach(() => {
      args = {};
      spyOn(viewModel, 'performUpdate');
      spyOn(viewModel, 'dispatch');
    });

    it('calls "performUpdate" method', () => {
      viewModel.updateRoles(args);

      expect(viewModel.performUpdate).toHaveBeenCalledWith(args);
    });

    it('dispatches "saveCustomRole" event with groupId', () => {
      args.roleId = 711;
      viewModel.updateRoles(args);

      expect(viewModel.dispatch).toHaveBeenCalledWith({
        type: 'saveCustomRole',
        groupId: args.roleId,
      });
    });

    it('pushes action into deferredSave if it is defined', () => {
      viewModel.attr('deferredSave', {
        push: jasmine.createSpy(),
      });

      viewModel.updateRoles(args);
      expect(viewModel.performUpdate.calls.count()).toBe(1);

      viewModel.attr('deferredSave').push.calls.allArgs()[0][0]();
      expect(viewModel.performUpdate.calls.count()).toBe(2);
    });
  });

  describe('"performUpdate" method', () => {
    beforeEach(() => {
      spyOn(viewModel, 'updateAccessControlList');
      spyOn(viewModel, 'checkConflicts');
    });

    it('calls "updateAccessControlList" method', () => {
      const args = {
        people: 'mockPeople',
        roleId: 'mockRoleId',
      };

      viewModel.performUpdate(args);

      expect(viewModel.updateAccessControlList)
        .toHaveBeenCalledWith(args.people, args.roleId);
    });

    it('calls "checkConflicts" method if conflictRoles is not empty', () => {
      const args = {
        roleTitle: 'mockRoleTitle',
      };
      viewModel.attr('conflictRoles', [1, 2]);

      viewModel.performUpdate(args);

      expect(viewModel.checkConflicts).toHaveBeenCalledWith(args.roleTitle);
    });

    it('does not call "checkConflicts" method if conflictRoles is empty',
      () => {
        viewModel.attr('conflictRoles', []);

        viewModel.performUpdate({});

        expect(viewModel.checkConflicts).not.toHaveBeenCalled();
      });
  });

  beforeEach(() => {
    spyOn(aclUtils, 'getRolesForType').and.returnValue([
      {id: 1, name: 'Admin', mandatory: true,
        object_type: 'Control'},
      {id: 3, name: 'Primary Contacts', mandatory: false,
        object_type: 'Control'},
      {id: 4, name: 'Secondary Contacts', mandatory: true,
        object_type: 'Control'},
      {id: 5, name: 'Principal Assignees', mandatory: false,
        object_type: 'Control'},
      {id: 6, name: 'Secondary Assignees', mandatory: true,
        object_type: 'Control'},
    ]);
  });

  describe('"getFilteredRoles" method', function () {
    let instance;
    let getFilteredRolesMethod;

    beforeAll(function () {
      instance = makeFakeInstance({model: Control})();
    });

    beforeEach(function () {
      viewModel.attr('instance', instance);
      viewModel.attr('includeRoles', []);
      viewModel.attr('excludeRoles', []);

      getFilteredRolesMethod = viewModel.getFilteredRoles.bind(viewModel);
    });

    it('should return all roles related to instance type', function () {
      let roles = getFilteredRolesMethod();
      expect(roles.length).toBe(5);
    });

    it('should return roles from IncludeRoles list', function () {
      let roles;
      let include = ['Admin', 'Secondary Contacts', 'Principal Assignees'];

      viewModel.attr('includeRoles', include);
      roles = getFilteredRolesMethod();

      expect(roles.length).toBe(3);
      expect(roles[2].name).toEqual('Principal Assignees');
    });

    it('should return all roles except roles from ExcludeRoles list',
      function () {
        let roles;
        let exclude = ['Admin', 'Secondary Contacts', 'Principal Assignees'];

        viewModel.attr('excludeRoles', exclude);
        roles = getFilteredRolesMethod();

        expect(roles.length).toBe(2);
        expect(roles[1].name).toEqual('Secondary Assignees');
      }
    );

    it('should return roles from IncludeRoles withou roles from ExcludeRoles',
      function () {
        let roles;
        let include = ['Admin', 'Secondary Contacts', 'Principal Assignees'];
        let exclude = ['Admin', 'Principal Assignees', 'Primary Contacts'];

        viewModel.attr('includeRoles', include);
        viewModel.attr('excludeRoles', exclude);
        roles = getFilteredRolesMethod();

        expect(roles.length).toBe(1);
        expect(roles[0].name).toEqual('Secondary Contacts');
      }
    );
  });

  describe('"checkConflicts" method', function () {
    let instance;

    beforeAll(function () {
      instance = makeFakeInstance({model: Control})();
    });

    beforeEach(function () {
      viewModel.attr('instance', instance);
      viewModel.attr('includeRoles', []);
      viewModel.attr('excludeRoles', []);
    });

    function isGroupsHasConflict(conflictRoles, acl) {
      let groups;
      instance.attr('access_control_list', acl);
      viewModel.attr('instance', instance);
      viewModel.attr('groups', viewModel.getRoleList());
      groups = viewModel.attr('groups');

      return viewModel
        .isGroupsHasConflict(groups, conflictRoles);
    }

    function isCurrentGroupHasConflict(currentGroup, conflictRoles, acl) {
      let groups;
      instance.attr('access_control_list', acl);
      viewModel.attr('instance', instance);
      viewModel.attr('groups', viewModel.getRoleList());
      groups = viewModel.attr('groups');

      return viewModel
        .isCurrentGroupHasConflict(currentGroup, groups, conflictRoles);
    }

    it('"isGroupsHasConflict" should return TRUE. 2 groups conflict',
      function () {
        let conflictRoles = ['Admin', 'Primary Contacts'];
        let hasConflicts = false;
        let acl = [
          {ac_role_id: 1, person: {id: 1}},
          {ac_role_id: 1, person: {id: 2}},
          {ac_role_id: 1, person: {id: 3}},
          // conflict with ac_role_id: 1
          {ac_role_id: 3, person: {id: 3}},
          {ac_role_id: 3, person: {id: 4}},
          {ac_role_id: 4, person: {id: 1}},
        ];

        hasConflicts = isGroupsHasConflict(conflictRoles, acl);
        expect(hasConflicts).toBeTruthy();
      }
    );

    it('"isGroupsHasConflict" should return TRUE. 3 groups conflict',
      function () {
        let conflictRoles = [
          'Admin',
          'Primary Contacts',
          'Secondary Assignees',
        ];
        let hasConflicts = false;
        let acl = [
          {ac_role_id: 1, person: {id: 1}},
          {ac_role_id: 1, person: {id: 2}},
          {ac_role_id: 1, person: {id: 3}},

          // conflict with ac_role_id: 1
          {ac_role_id: 3, person: {id: 3}},
          {ac_role_id: 3, person: {id: 4}},
          {ac_role_id: 4, person: {id: 1}},

          // conflict with ac_role_id 3
          {ac_role_id: 6, person: {id: 4}},
        ];

        hasConflicts = isGroupsHasConflict(conflictRoles, acl);
        expect(hasConflicts).toBeTruthy();
      }
    );

    it('"isGroupsHasConflict" should return FALSE. 3 groups conflict',
      function () {
        let conflictRoles = [
          'Admin',
          'Primary Contacts',
          'Secondary Assignees',
        ];
        let hasConflicts = false;
        let acl = [
          {ac_role_id: 1, person: {id: 1}},
          {ac_role_id: 1, person: {id: 2}},
          {ac_role_id: 1, person: {id: 3}},
          {ac_role_id: 3, person: {id: 7}},
          {ac_role_id: 3, person: {id: 4}},
          {ac_role_id: 4, person: {id: 1}},
          {ac_role_id: 6, person: {id: 14}},
        ];

        hasConflicts = isGroupsHasConflict(conflictRoles, acl);

        expect(hasConflicts).toBeFalsy();
      }
    );

    it('"isCurrentGroupHasConflict" should return TRUE. 2 groups conflict',
      function () {
        let conflictRoles = ['Admin', 'Primary Contacts'];
        let hasConflicts = false;
        let acl = [
          {ac_role_id: 1, person: {id: 1}},
          {ac_role_id: 1, person: {id: 2}},
          {ac_role_id: 1, person: {id: 3}},
          // conflict with ac_role_id: 1
          {ac_role_id: 3, person: {id: 3}},
          {ac_role_id: 3, person: {id: 4}},
          {ac_role_id: 4, person: {id: 1}},
        ];

        hasConflicts = isCurrentGroupHasConflict('Admin', conflictRoles, acl);
        expect(hasConflicts).toBeTruthy();
      }
    );

    it('"isCurrentGroupHasConflict" should return TRUE. 3 groups conflict',
      function () {
        let conflictRoles = [
          'Admin',
          'Primary Contacts',
          'Secondary Assignees',
        ];
        let hasConflicts = false;
        let acl = [
          {ac_role_id: 1, person: {id: 1}},
          {ac_role_id: 1, person: {id: 2}},
          {ac_role_id: 1, person: {id: 3}},

          // conflict with ac_role_id: 1
          {ac_role_id: 3, person: {id: 3}},
          {ac_role_id: 3, person: {id: 4}},
          {ac_role_id: 4, person: {id: 1}},

          // conflict with ac_role_id 3
          {ac_role_id: 6, person: {id: 4}},
        ];

        hasConflicts = isCurrentGroupHasConflict('Admin', conflictRoles, acl);
        expect(hasConflicts).toBeTruthy();
      }
    );

    it('"isCurrentGroupHasConflict" should return FALSE. 3 groups conflict',
      function () {
        let conflictRoles = [
          'Admin',
          'Primary Contacts',
          'Secondary Assignees',
        ];
        let hasConflicts = false;
        let acl = [
          {ac_role_id: 1, person: {id: 1}},
          {ac_role_id: 1, person: {id: 2}},
          {ac_role_id: 1, person: {id: 3}},
          {ac_role_id: 3, person: {id: 7}},
          {ac_role_id: 3, person: {id: 4}},
          {ac_role_id: 4, person: {id: 1}},
          {ac_role_id: 6, person: {id: 14}},
        ];

        hasConflicts = isCurrentGroupHasConflict('Admin', conflictRoles, acl);
        expect(hasConflicts).toBeFalsy();
      }
    );
  });

  describe('"setGroupOrder" method', function () {
    const groups = [
      {title: 'Primary Contacts', id: 1},
      {title: 'Secondary Contacts', id: 2},
      {title: 'Verifier', id: 3},
      {title: 'Admin', id: 4},
      {title: 'Creator', id: 5},
      {title: 'Assessor', id: 6},
    ];

    function checkOrder(orderArray) {
      let result = viewModel.setGroupOrder(groups, orderArray);

      expect(result.length).toBe(6);
      expect(result[0].title).toEqual('Primary Contacts');
      expect(result[2].title).toEqual('Verifier');
      expect(result[5].title).toEqual('Assessor');
    }

    it('should not change order of groups. Empty order array', function () {
      checkOrder([]);
    });

    it('should not change order of groups. Without order array', function () {
      checkOrder();
    });

    it('should not change order of groups. Order array has wrong titles',
      function () {
        let orderArray = ['My Role', 'Primary', 'Contacts'];
        checkOrder(orderArray);
      }
    );

    it('should change order of groups', function () {
      let orderArray = ['Creator', 'Assessor', 'Verifier'];
      let result = viewModel.setGroupOrder(groups, orderArray);

      expect(result.length).toBe(6);
      expect(result[0].title).toEqual('Creator');
      expect(result[1].title).toEqual('Assessor');
      expect(result[2].title).toEqual('Verifier');
    });
  });

  describe('"updateAccessControlList" method', function () {
    let instance;
    let acl = [
      {ac_role_id: 1, person: {id: 1, type: 'Person'}},
      {ac_role_id: 1, person: {id: 2, type: 'Person'}},
      {ac_role_id: 2, person: {id: 3, type: 'Person'}},
      {ac_role_id: 3, person: {id: 4, type: 'Person'}},
    ];

    beforeAll(function () {
      instance = makeFakeInstance({model: Control})();
    });

    beforeEach(function () {
      instance.attr('access_control_list', acl);
      viewModel.attr('instance', instance);
    });

    it('add people w/o current role', () => {
      const peopleList = [{id: 1}, {id: 2}];
      viewModel.updateAccessControlList(peopleList, 1);

      const result = instance.attr('access_control_list');
      expect(result.length).toBe(acl.length);
    });

    it('update people w current role', () => {
      const peopleList = [{id: 1}, {id: 2}];
      viewModel.updateAccessControlList(peopleList, 2);

      const result = instance.attr('access_control_list');
      expect(result.length).toBe(acl.length + 1);
    });

    it('remove people w current role', () => {
      viewModel.updateAccessControlList([], 3);

      const result = instance.attr('access_control_list');
      expect(result.length).toBe(acl.length - 1);
    });
  });

  describe('"buildGroups" method', function () {
    let roles = [
      {id: 0, name: 'Role Name1', mandatory: false},
      {id: 1, name: 'Role Name2', mandatory: true},
    ];

    let assignment = {
      person: {id: 1},
      person_email: 'example@email.com',
      person_name: 'Person Name',
      type: 'Person',
    };

    beforeEach(function () {
      viewModel.attr('includeRoles', [roles[1].name]);
    });

    it('should not create group if role is not present in IncludeRoles list',
      () => {
        const result = viewModel.buildGroups(roles[0], [[], [assignment]]);
        expect(result).not.toBeDefined();
      });

    it('should generate group w/ non empty people list if role is found in acl',
      () => {
        const result = viewModel.buildGroups(roles[1], [[], [assignment]]);
        const group = {
          title: roles[1].name,
          groupId: roles[1].id,
          people: [{
            id: assignment.person.id,
            email: assignment.person_email,
            name: assignment.person_name,
            type: assignment.type,
          }],
          required: roles[1].mandatory,
          singleUserRole: false,
        };
        expect(result).toEqual(group);
      }
    );

    it('should generate group w/ empty people list if role is not found in acl',
      () => {
        const result = viewModel.buildGroups(roles[1], [{person: {id: 4}}]);
        const group = {
          title: roles[1].name,
          groupId: roles[1].id,
          people: [],
          required: roles[1].mandatory,
          singleUserRole: false,
        };
        expect(result).toEqual(group);
      }
    );

    it(`should generate group w/ "singleUserRole=true" if role is present
       in singleUserRoles attr`, () => {
      const group = {
        title: roles[1].name,
        groupId: roles[1].id,
        people: [],
        required: roles[1].mandatory,
        singleUserRole: true,
      };
      viewModel.attr('singleUserRoles', {'Role Name2': true});

      const result = viewModel.buildGroups(roles[1], [{person: {id: 4}}]);

      expect(result).toEqual(group);
    }
    );

    it(`should generate group w/ "singleUserRole=false" if role not present
    in singleUserRoles attr`, () => {
      const group = {
        title: roles[1].name,
        groupId: roles[1].id,
        people: [],
        required: roles[1].mandatory,
        singleUserRole: false,
      };
      viewModel.attr('singleUserRoles', {'Role Name1': true});

      const result = viewModel.buildGroups(roles[1], [{person: {id: 4}}]);

      expect(result).toEqual(group);
    }
    );
  });

  describe('"getRoleList" method', function () {
    let instance;
    let acl = [
      {ac_role_id: 1, person: {id: 1, type: 'Person'}},
      {ac_role_id: 2, person: {id: 2, type: 'Person'}},
      {ac_role_id: 3, person: {id: 3, type: 'Person'}},
    ];

    beforeAll(function () {
      instance = makeFakeInstance({model: Control})();
    });

    beforeEach(function () {
      instance.attr('access_control_list', acl);
      viewModel.attr('instance', instance);
      viewModel.attr('includeRoles', []);
      viewModel.attr('excludeRoles', []);
    });

    it('should return empty rolesInfo list if "instance" not defined', () => {
      viewModel.attr('instance', undefined);
      viewModel.getRoleList();
      expect(viewModel.attr('rolesInfo').length).toBe(0);
    });

    it('should return groups build based on all roles ' +
      'related to instance type', () => {
      const groups = viewModel.getRoleList();
      expect(groups.length).toBe(5);
    });

    it('should return groups build based on roles from IncludeRoles list',
      () => {
        let include = ['Admin', 'Secondary Contacts', 'Principal Assignees'];
        viewModel.attr('includeRoles', include);

        const groups = viewModel.getRoleList();
        expect(groups.length).toBe(include.length);
        groups.forEach((group) => {
          expect(include).toContain(group.title);
        });
      });

    it('should return all groups build based on roles except roles from ' +
      'ExcludeRoles list', () => {
      let exclude = ['Admin', 'Secondary Assignees', 'Principal Assignees'];
      viewModel.attr('excludeRoles', exclude);

      const groups = viewModel.getRoleList();
      expect(groups.length).toBe(2);
      expect(groups[0].title).toEqual('Secondary Contacts');
      expect(groups[0].required).toBe(true);
      expect(groups[1].title).toEqual('Primary Contacts');
      expect(groups[1].required).toBe(false);
    });

    it('should return groups build based on roles from IncludeRoles ' +
      'w/o roles from ExcludeRoles list', () => {
      let include = ['Admin', 'Principal Assignees', 'Principal Assignees'];
      let exclude = ['Admin', 'Primary Contacts', 'Secondary Contacts'];
      viewModel.attr('includeRoles', include);
      viewModel.attr('excludeRoles', exclude);

      const groups = viewModel.getRoleList();
      expect(groups.length).toBe(1);
      expect(groups[0].title).toEqual('Principal Assignees');
      expect(groups[0].required).toBe(false);
    });
  });
});
