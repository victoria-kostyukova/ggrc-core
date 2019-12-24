/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loIntersection from 'lodash/intersection';
import loGroupBy from 'lodash/groupBy';
import loIndexOf from 'lodash/indexOf';
import loFindIndex from 'lodash/findIndex';
import loMap from 'lodash/map';
import loSome from 'lodash/some';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import {ROLES_CONFLICT} from '../../events/event-types';
import {getRolesForType} from '../../plugins/utils/acl-utils';
import {refreshPermissions} from '../../permission';
import {getCurrentUser} from '../../plugins/utils/user-utils';

const ViewModel = canDefineMap.extend({
  instance: {
    value: () => ({}),
  },
  deferredSave: {
    value: null,
  },
  includeRoles: {
    value: () => [],
  },
  groups: {
    value: () => [],
  },
  updatableGroupId: {
    value: null,
  },
  isNewInstance: {
    value: false,
  },
  excludeRoles: {
    value: () => [],
  },
  conflictRoles: {
    value: () => [],
  },
  orderOfRoles: {
    value: () => [],
  },
  hasConflicts: {
    value: false,
  },
  readOnly: {
    value: false,
  },
  rolesInfo: {
    value: () => [],
  },
  isCurrentUserPermissionsChanged: {
    value: false,
  },
  singleUserRoles: {
    value: Object.freeze({
      Assignee: true,
      Verifier: true,
    }),
  },
  updateRoles(args) {
    if (this.deferredSave) {
      this.deferredSave.push(this.performUpdate.bind(this, args));
    }
    this.performUpdate(args);

    this.dispatch({
      type: 'saveCustomRole',
      groupId: args.roleId,
    });
  },
  performUpdate(args) {
    this.updateAccessControlList(args.people, args.roleId);

    if (this.conflictRoles.length) {
      this.checkConflicts(args.roleTitle);
    }
  },
  updateAccessControlList(people, roleId) {
    const instance = this.instance;
    const accessControlList = instance.attr('access_control_list');

    // get people without current role
    const listWithoutRole = accessControlList
      .filter((item) => item.ac_role_id !== roleId);

    const newListWithRole = people
      .map(({id}) => ({ac_role_id: roleId, person: {id, type: 'Person'}}));

    if (!this.isNewInstance) {
      const oldListWithRole = accessControlList
        .filter((item) => (item.ac_role_id === roleId));

      this.checkIsCurrentUserPermissionsChanged(
        oldListWithRole,
        newListWithRole
      );
    }

    instance.attr('access_control_list',
      listWithoutRole.concat(newListWithRole));
  },
  checkIsCurrentUserPermissionsChanged(oldListWithRole, newListWithRole) {
    const currentUserId = getCurrentUser().id;
    const isCurrentUserHadRole =
      loSome(oldListWithRole, ({person: {id}}) => currentUserId === id);
    const isCurrentUserWillHaveRole =
      loSome(newListWithRole, ({person: {id}}) => currentUserId === id);

    if (isCurrentUserHadRole && !isCurrentUserWillHaveRole
      || !isCurrentUserHadRole && isCurrentUserWillHaveRole) {
      this.isCurrentUserPermissionsChanged = true;
    }
  },
  checkConflicts(groupTitle) {
    let groups = this.groups;
    let conflictRoles = this.conflictRoles;
    let hasConflict = false;

    if (groupTitle && conflictRoles.indexOf(groupTitle) === -1) {
      return;
    }

    hasConflict = groupTitle ?
      this.isCurrentGroupHasConflict(groupTitle, groups, conflictRoles) :
      this.isGroupsHasConflict(groups, conflictRoles);

    this.hasConflicts = hasConflict;
    this.instance.dispatch({
      ...ROLES_CONFLICT,
      rolesConflict: hasConflict,
    });
  },
  isGroupsHasConflict(groups, conflictRoles) {
    let hasConflict = false;

    let conflictGroups = groups
      .filter((group) => loIndexOf(conflictRoles, group.title) > -1);

    conflictGroups.forEach((conflictGroup) => {
      let otherConflictGroups = conflictGroups
        .filter((group) => group.groupId !== conflictGroup.groupId);

      // compare people from current group (conflictGroup)
      // with each other group (otherConflictGroups)
      otherConflictGroups.forEach((group) => {
        // get 2 people ids arrays
        let peopleIds = [conflictGroup, group]
          .map((group) => group.people)
          .map((people) => people.map((person) => person.id));

        hasConflict = !!loIntersection(...peopleIds).length;
      });
    });

    return hasConflict;
  },
  isCurrentGroupHasConflict(groupTitle, groups, conflictRoles) {
    let hasConflict = false;

    // get people IDs from conflict groups except current group
    let peopleIds = groups
      .filter((group) => groupTitle !== group.title &&
        loIndexOf(conflictRoles, group.title) > -1)
      .map((group) => group.people)
      .map((people) => people.map((person) => person.id));

    // get people IDs from current conflict group
    let currentGroupPeopleIds = groups
      .filter((group) => groupTitle === group.title)
      .map((group) => group.people)
      .map((people) => people.map((person) => person.id))[0];

    peopleIds.forEach((peopleGroupIds) => {
      if (loIntersection(peopleGroupIds, currentGroupPeopleIds).length) {
        hasConflict = true;
      }
    });

    return hasConflict;
  },
  buildGroups(role, roleAssignments) {
    let includeRoles = this.includeRoles;
    let groupId = role.id;
    let title = role.name;
    let singleUserRole = this.singleUserRoles[title] ? true : false;

    if (includeRoles.length && includeRoles.indexOf(title) === -1) {
      return;
    }

    return {
      title: title,
      groupId: groupId,
      people: this.getPeople(roleAssignments, groupId),
      required: role.mandatory,
      singleUserRole: singleUserRole,
    };
  },
  getPeople(roleAssignments, groupId) {
    let people = roleAssignments[groupId];
    return people ?
      people.map((person) => {
        return {
          id: person.person.id,
          email: person.person_email,
          name: person.person_name,
          type: 'Person',
        };
      }) :
      [];
  },
  filterByIncludeExclude(includeRoles, excludeRoles) {
    const instance = this.instance;
    const objectRoles = getRolesForType(instance.constructor.model_singular);

    return objectRoles.filter((item) => {
      return loIndexOf(includeRoles, item.name) > -1 &&
        loIndexOf(excludeRoles, item.name) === -1;
    });
  },
  filterByInclude(includeRoles) {
    const instance = this.instance;
    const objectRoles = getRolesForType(instance.constructor.model_singular);

    return objectRoles.filter((item) =>
      loIndexOf(includeRoles, item.name) > -1);
  },
  filterByExclude(excludeRoles) {
    const instance = this.instance;
    const objectRoles = getRolesForType(instance.constructor.model_singular);

    return objectRoles.filter((item) =>
      loIndexOf(excludeRoles, item.name) === -1);
  },
  getFilteredRoles() {
    const instance = this.instance;
    const includeRoles = this.includeRoles;
    const excludeRoles = this.excludeRoles;
    let roles;

    if (includeRoles.length && excludeRoles.length) {
      roles = this.filterByIncludeExclude(includeRoles, excludeRoles);
    } else if (includeRoles.length) {
      roles = this.filterByInclude(includeRoles);
    } else if (excludeRoles.length) {
      roles = this.filterByExclude(excludeRoles);
    } else {
      roles = getRolesForType(instance.constructor.model_singular);
    }

    return roles;
  },
  setGroupOrder(groups, orderOfRoles) {
    if (!Array.isArray(orderOfRoles)) {
      return groups;
    }

    orderOfRoles.forEach((roleName, index) => {
      let roleIndex = loFindIndex(groups, {title: roleName});
      let group;
      let firstGroup;

      if (roleIndex === -1 || roleIndex === index) {
        return;
      }

      group = groups[roleIndex];
      firstGroup = groups[index];

      groups[index] = group;
      groups[roleIndex] = firstGroup;
    });

    return groups;
  },
  getRoleList() {
    let roleAssignments;
    let roles;
    let groups;
    let instance = this.instance;

    if (!instance) {
      this.rolesInfo = [];
      return;
    }

    roleAssignments = loGroupBy(
      instance.attr('access_control_list'), 'ac_role_id'
    );

    roles = this.getFilteredRoles();

    groups = loMap(roles, (role) => {
      return this.buildGroups(role, roleAssignments);
    })
      .filter((group) => {
        return typeof group !== 'undefined';
      })
      // sort by required
      .sort((a, b) => {
        if (a.required === b.required) {
          return 0;
        }

        return a.required ? -1 : 1;
      });

    if (this.orderOfRoles.length) {
      groups = this.setGroupOrder(groups, this.orderOfRoles.serialize());
    }

    return groups;
  },
  refreshPeopleInGroups() {
    let instance = this.instance;
    let groups = this.groups;
    let roleAssignments = loGroupBy(
      instance.attr('access_control_list'), 'ac_role_id'
    );

    groups.forEach((group) =>
      group.people = this.getPeople(roleAssignments, group.groupId)
    );
  },
  setupGroups() {
    this.groups = this.getRoleList();
    this.checkConflicts();
  },
});

export default canComponent.extend({
  tag: 'related-people-access-control',
  leakScope: true,
  ViewModel,
  events: {
    init() {
      this.viewModel.setupGroups();
    },
    '{viewModel.instance} updated'() {
      if (this.viewModel.isCurrentUserPermissionsChanged) {
        refreshPermissions();
        this.viewModel.isCurrentUserPermissionsChanged = false;
      }
      this.viewModel.refreshPeopleInGroups();
      this.viewModel.checkConflicts();
    },
    '{viewModel} instance'() {
      this.viewModel.setupGroups();
    },
  },
});
