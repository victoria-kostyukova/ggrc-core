/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import Component from '../related-people-access-control';
import {
  getComponentVM,
  makeFakeInstance,
} from '../../../../js_specs/spec-helpers';
import * as aclUtils from '../../../plugins/utils/acl-utils';
import Control from '../../../models/business-models/control';
import * as Permission from '../../../permission';
import * as userUtils from '../../../plugins/utils/user-utils';

describe('related-people-access-control component', () => {
  let ViewModel;

  beforeAll(() => {
    ViewModel = getComponentVM(Component);
  });

  describe('"updateRoles" method', () => {
    let args;

    beforeEach(() => {
      args = {};
      spyOn(ViewModel, 'performUpdate');
      spyOn(ViewModel, 'dispatch');
    });

    it('calls "performUpdate" method', () => {
      ViewModel.updateRoles(args);

      expect(ViewModel.performUpdate).toHaveBeenCalledWith(args);
    });

    it('dispatches "saveCustomRole" event with groupId', () => {
      args.roleId = 711;
      ViewModel.updateRoles(args);

      expect(ViewModel.dispatch).toHaveBeenCalledWith({
        type: 'saveCustomRole',
        groupId: args.roleId,
      });
    });

    it('pushes action into deferredSave if it is defined', () => {
      ViewModel.deferredSave = {
        push: jasmine.createSpy(),
      };

      ViewModel.updateRoles(args);
      expect(ViewModel.performUpdate.calls.count()).toBe(1);

      ViewModel.deferredSave.push.calls.allArgs()[0][0]();
      expect(ViewModel.performUpdate.calls.count()).toBe(2);
    });
  });

  describe('"performUpdate" method', () => {
    beforeEach(() => {
      spyOn(ViewModel, 'updateAccessControlList');
      spyOn(ViewModel, 'checkConflicts');
    });

    it('calls "updateAccessControlList" method', () => {
      const args = {
        people: 'mockPeople',
        roleId: 'mockRoleId',
      };

      ViewModel.performUpdate(args);

      expect(ViewModel.updateAccessControlList)
        .toHaveBeenCalledWith(args.people, args.roleId);
    });

    it('calls "checkConflicts" method if conflictRoles is not empty', () => {
      const args = {
        roleTitle: 'mockRoleTitle',
      };
      ViewModel.conflictRoles = [1, 2];

      ViewModel.performUpdate(args);

      expect(ViewModel.checkConflicts).toHaveBeenCalledWith(args.roleTitle);
    });

    it('does not call "checkConflicts" method if conflictRoles is empty',
      () => {
        ViewModel.conflictRoles = [];

        ViewModel.performUpdate({});

        expect(ViewModel.checkConflicts).not.toHaveBeenCalled();
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

  describe('"getFilteredRoles" method', () => {
    let instance;
    let getFilteredRolesMethod;

    beforeAll(() => {
      instance = makeFakeInstance({model: Control})();
    });

    beforeEach(() => {
      ViewModel.instance = instance;
      ViewModel.includeRoles = [];
      ViewModel.excludeRoles = [];

      getFilteredRolesMethod = ViewModel.getFilteredRoles.bind(ViewModel);
    });

    it('should return all roles related to instance type', () => {
      let roles = getFilteredRolesMethod();
      expect(roles.length).toBe(5);
    });

    it('should return roles from IncludeRoles list', () => {
      let roles;
      let include = ['Admin', 'Secondary Contacts', 'Principal Assignees'];

      ViewModel.includeRoles = include;
      roles = getFilteredRolesMethod();

      expect(roles.length).toBe(3);
      expect(roles[2].name).toEqual('Principal Assignees');
    });

    it('should return all roles except roles from ExcludeRoles list',
      () => {
        let roles;
        let exclude = ['Admin', 'Secondary Contacts', 'Principal Assignees'];

        ViewModel.excludeRoles = exclude;
        roles = getFilteredRolesMethod();

        expect(roles.length).toBe(2);
        expect(roles[1].name).toEqual('Secondary Assignees');
      }
    );

    it('should return roles from IncludeRoles without roles from ExcludeRoles',
      () => {
        let roles;
        let include = ['Admin', 'Secondary Contacts', 'Principal Assignees'];
        let exclude = ['Admin', 'Principal Assignees', 'Primary Contacts'];

        ViewModel.includeRoles = include;
        ViewModel.excludeRoles = exclude;
        roles = getFilteredRolesMethod();

        expect(roles.length).toBe(1);
        expect(roles[0].name).toEqual('Secondary Contacts');
      }
    );
  });

  describe('"checkConflicts" method', () => {
    let instance;

    beforeAll(() => {
      instance = makeFakeInstance({model: Control})();
    });

    beforeEach(() => {
      ViewModel.instance = instance;
      ViewModel.includeRoles = [];
      ViewModel.excludeRoles = [];
    });

    function isGroupsHasConflict(conflictRoles, acl) {
      let groups;
      instance.attr('access_control_list', acl);
      ViewModel.instance = instance;
      ViewModel.groups = ViewModel.getRoleList();
      groups = ViewModel.groups;

      return ViewModel
        .isGroupsHasConflict(groups, conflictRoles);
    }

    function isCurrentGroupHasConflict(currentGroup, conflictRoles, acl) {
      let groups;
      instance.attr('access_control_list', acl);
      ViewModel.instance = instance;
      ViewModel.groups = ViewModel.getRoleList();
      groups = ViewModel.groups;

      return ViewModel
        .isCurrentGroupHasConflict(currentGroup, groups, conflictRoles);
    }

    it('"isGroupsHasConflict" should return TRUE. 2 groups conflict',
      () => {
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
      () => {
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
      () => {
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
      () => {
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
      () => {
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
      () => {
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

  describe('"setGroupOrder" method', () => {
    const groups = [
      {title: 'Primary Contacts', id: 1},
      {title: 'Secondary Contacts', id: 2},
      {title: 'Verifier', id: 3},
      {title: 'Admin', id: 4},
      {title: 'Creator', id: 5},
      {title: 'Assessor', id: 6},
    ];

    function checkOrder(orderArray) {
      let result = ViewModel.setGroupOrder(groups, orderArray);

      expect(result.length).toBe(6);
      expect(result[0].title).toEqual('Primary Contacts');
      expect(result[2].title).toEqual('Verifier');
      expect(result[5].title).toEqual('Assessor');
    }

    it('should not change order of groups. Empty order array', () => {
      checkOrder([]);
    });

    it('should not change order of groups. Without order array', () => {
      checkOrder();
    });

    it('should not change order of groups. Order array has wrong titles',
      () => {
        let orderArray = ['My Role', 'Primary', 'Contacts'];
        checkOrder(orderArray);
      }
    );

    it('should change order of groups', () => {
      let orderArray = ['Creator', 'Assessor', 'Verifier'];
      let result = ViewModel.setGroupOrder(groups, orderArray);

      expect(result.length).toBe(6);
      expect(result[0].title).toEqual('Creator');
      expect(result[1].title).toEqual('Assessor');
      expect(result[2].title).toEqual('Verifier');
    });
  });

  describe('"updateAccessControlList" method', () => {
    let instance;
    let acl = [
      {ac_role_id: 1, person: {id: 1, type: 'Person'}},
      {ac_role_id: 1, person: {id: 2, type: 'Person'}},
      {ac_role_id: 2, person: {id: 3, type: 'Person'}},
      {ac_role_id: 3, person: {id: 4, type: 'Person'}},
    ];

    beforeAll(() => {
      instance = makeFakeInstance({model: Control})();
    });

    beforeEach(() => {
      instance.attr('access_control_list', acl);
      ViewModel.instance = instance;
    });

    it('add people w/o current role', () => {
      const peopleList = [{id: 1}, {id: 2}];
      ViewModel.updateAccessControlList(peopleList, 1);

      const result = instance.access_control_list;
      expect(result.length).toBe(acl.length);
    });

    it('update people w current role', () => {
      const peopleList = [{id: 1}, {id: 2}];
      ViewModel.updateAccessControlList(peopleList, 2);

      const result = instance.access_control_list;
      expect(result.length).toBe(acl.length + 1);
    });

    it('remove people w current role', () => {
      ViewModel.updateAccessControlList([], 3);

      const result = instance.access_control_list;
      expect(result.length).toBe(acl.length - 1);
    });

    it(`calls "checkIsCurrentUserPermissionsChanged" if
     instance is not new`, () => {
      spyOn(ViewModel, 'checkIsCurrentUserPermissionsChanged');
      ViewModel.isNewInstance = false;
      ViewModel.updateAccessControlList([]);

      expect(ViewModel.checkIsCurrentUserPermissionsChanged)
        .toHaveBeenCalled();
    });

    it(`does not call "checkIsCurrentUserPermissionsChanged" if
     instance is new`, () => {
      spyOn(ViewModel, 'checkIsCurrentUserPermissionsChanged');
      ViewModel.isNewInstance = true;
      ViewModel.updateAccessControlList([]);

      expect(ViewModel.checkIsCurrentUserPermissionsChanged)
        .not.toHaveBeenCalled();
    });

    it(`calls "checkIsCurrentUserPermissionsChanged" with
     correct arguments`, () => {
      const spy = spyOn(ViewModel, 'checkIsCurrentUserPermissionsChanged');
      ViewModel.isNewInstance = false;
      const people = [{id: 11}, {id: 22}, {id: 33}];
      ViewModel.updateAccessControlList(people, 1);

      const {args} = spy.calls.mostRecent();
      const firstArg = args[0].serialize();
      const secondArg = args[1];
      const expectedFirstArg = [
        {ac_role_id: 1, person: {id: 1, type: 'Person'}},
        {ac_role_id: 1, person: {id: 2, type: 'Person'}},
      ];
      const expectedSecongArg = [
        {ac_role_id: 1, person: {id: 11, type: 'Person'}},
        {ac_role_id: 1, person: {id: 22, type: 'Person'}},
        {ac_role_id: 1, person: {id: 33, type: 'Person'}},
      ];
      expect(firstArg).toEqual(expectedFirstArg);
      expect(secondArg).toEqual(expectedSecongArg);
    });
  });

  describe('"checkIsCurrentUserPermissionsChanged"', () => {
    let instance;

    beforeAll(function () {
      instance = makeFakeInstance({model: Control})();
      ViewModel.infoPaneMode = true;
    });

    beforeEach(function () {
      ViewModel.instance = instance;
      ViewModel.isCurrentUserPermissionsChanged = false;
    });

    it(`should set "isCurrentUserPermissionsChanged" flag true if current
       user get the role`, () => {
      spyOn(userUtils, 'getCurrentUser').and.returnValue({id: 1});
      ViewModel.checkIsCurrentUserPermissionsChanged(
        [],
        [{person: {id: 1}}]
      );
      expect(ViewModel.isCurrentUserPermissionsChanged).toBe(true);
    });

    it(`should set "isCurrentUserPermissionsChanged" flag true if current
       user leaves the role`, () => {
      spyOn(userUtils, 'getCurrentUser').and.returnValue({id: 1});
      ViewModel.checkIsCurrentUserPermissionsChanged(
        [{person: {id: 1}}],
        []
      );
      expect(ViewModel.isCurrentUserPermissionsChanged).toBe(true);
    });

    it(`should set "isCurrentUserPermissionsChanged" flag false if current
       user had and will have a role`, () => {
      spyOn(userUtils, 'getCurrentUser').and.returnValue({id: 1});
      ViewModel.checkIsCurrentUserPermissionsChanged(
        [{person: {id: 1}}],
        [{person: {id: 1}}]
      );
      expect(ViewModel.isCurrentUserPermissionsChanged).toBe(false);
    });

    it(`should set "isCurrentUserPermissionsChanged" flag false if current
       user did not and will not have a role`, () => {
      spyOn(userUtils, 'getCurrentUser').and.returnValue({id: 1});
      ViewModel.checkIsCurrentUserPermissionsChanged([], []);
      expect(ViewModel.isCurrentUserPermissionsChanged).toBe(false);
    });
  });

  describe('"buildGroups" method', () => {
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

    beforeEach(() => {
      ViewModel.includeRoles = [roles[1].name];
    });

    it('should not create group if role is not present in IncludeRoles list',
      () => {
        const result = ViewModel.buildGroups(roles[0], [[], [assignment]]);
        expect(result).not.toBeDefined();
      });

    it('should generate group w/ non empty people list if role is found in acl',
      () => {
        const result = ViewModel.buildGroups(roles[1], [[], [assignment]]);
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
        const result = ViewModel.buildGroups(roles[1], [{person: {id: 4}}]);
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
      ViewModel.singleUserRoles = {'Role Name2': true};

      const result = ViewModel.buildGroups(roles[1], [{person: {id: 4}}]);

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
      ViewModel.singleUserRoles = {'Role Name1': true};

      const result = ViewModel.buildGroups(roles[1], [{person: {id: 4}}]);

      expect(result).toEqual(group);
    }
    );
  });

  describe('"getRoleList" method', () => {
    let instance;
    let acl = [
      {ac_role_id: 1, person: {id: 1, type: 'Person'}},
      {ac_role_id: 2, person: {id: 2, type: 'Person'}},
      {ac_role_id: 3, person: {id: 3, type: 'Person'}},
    ];

    beforeAll(() => {
      instance = makeFakeInstance({model: Control})();
    });

    beforeEach(() => {
      instance.attr('access_control_list', acl);
      ViewModel.instance = instance;
      ViewModel.includeRoles = [];
      ViewModel.excludeRoles = [];
    });

    it('should return empty rolesInfo list if "instance" not defined', () => {
      ViewModel.instance = undefined;
      ViewModel.getRoleList();
      expect(ViewModel.rolesInfo.length).toBe(0);
    });

    it('should return groups build based on all roles ' +
      'related to instance type', () => {
      const groups = ViewModel.getRoleList();
      expect(groups.length).toBe(5);
    });

    it('should return groups build based on roles from IncludeRoles list',
      () => {
        let include = ['Admin', 'Secondary Contacts', 'Principal Assignees'];
        ViewModel.includeRoles = include;

        const groups = ViewModel.getRoleList();
        expect(groups.length).toBe(include.length);
        groups.forEach((group) => {
          expect(include).toContain(group.title);
        });
      });

    it('should return all groups build based on roles except roles from ' +
      'ExcludeRoles list', () => {
      let exclude = ['Admin', 'Secondary Assignees', 'Principal Assignees'];
      ViewModel.excludeRoles = exclude;

      const groups = ViewModel.getRoleList();
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
      ViewModel.includeRoles = include;
      ViewModel.excludeRoles = exclude;

      const groups = ViewModel.getRoleList();
      expect(groups.length).toBe(1);
      expect(groups[0].title).toEqual('Principal Assignees');
      expect(groups[0].required).toBe(false);
    });
  });

  describe('"updated" event', () => {
    let event;
    let instance;

    beforeAll(() => {
      event = Component.prototype.events['{viewModel.instance} updated']
        .bind({viewModel: ViewModel});
      ViewModel.refreshPeopleInGroups = () => {};
      ViewModel.checkConflicts = () => {};
    });

    beforeEach(() => {
      instance = makeFakeInstance({model: Control})();
      ViewModel.instance = instance;
    });

    it(`should refresh permissions
       when "currentUserPermissionsChanged" flag is true`, () => {
      spyOn(Permission, 'refreshPermissions');
      ViewModel.isCurrentUserPermissionsChanged = true;
      event();
      expect(Permission.refreshPermissions).toHaveBeenCalled();
    });

    it(`should not refresh permissions
       when "currentUserPermissionsChanged" flag is false`, () => {
      spyOn(Permission, 'refreshPermissions');
      ViewModel.isCurrentUserPermissionsChanged = false;
      event();
      expect(Permission.refreshPermissions).not.toHaveBeenCalled();
    });
  });
});
