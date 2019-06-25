/*
  Copyright (C) 2019 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loIntersection from 'lodash/intersection';
import loGroupBy from 'lodash/groupBy';
import loIndexOf from 'lodash/indexOf';
import loFindIndex from 'lodash/findIndex';
import loMap from 'lodash/map';
import canMap from 'can-map';
import canComponent from 'can-component';
import {ROLES_CONFLICT} from '../../events/eventTypes';
import {getRolesForType} from '../../plugins/utils/acl-utils';

export default canComponent.extend({
  tag: 'related-people-access-control',
  leakScope: true,
  viewModel: canMap.extend({
    instance: {},
    deferredSave: null,
    includeRoles: [],
    groups: [],
    updatableGroupId: null,
    isNewInstance: false,
    excludeRoles: [],
    conflictRoles: [],
    orderOfRoles: [],
    hasConflicts: false,
    readOnly: false,
    singleUserRoles: Object.freeze({
      Assignee: true,
      Verifier: true,
    }),

    updateRoles(args) {
      if (this.attr('deferredSave')) {
        this.attr('deferredSave').push(this.performUpdate.bind(this, args));
      }
      this.performUpdate(args);

      this.dispatch({
        type: 'saveCustomRole',
        groupId: args.roleId,
      });
    },
    performUpdate(args) {
      this.updateAccessControlList(args.people, args.roleId);

      if (this.attr('conflictRoles').length) {
        this.checkConflicts(args.roleTitle);
      }
    },
    updateAccessControlList(people, roleId) {
      let instance = this.attr('instance');

      // get people without current role
      let listWithoutRole = instance
        .attr('access_control_list').filter((item) => {
          return item.ac_role_id !== roleId;
        });

      // push update people with current role
      people.forEach((person) => {
        listWithoutRole.push({
          ac_role_id: roleId,
          person: {id: person.id, type: 'Person'},
        });
      });

      instance.attr('access_control_list')
        .replace(listWithoutRole);
    },

    checkConflicts(groupTitle) {
      let groups = this.attr('groups');
      let conflictRoles = this.attr('conflictRoles');
      let hasConflict = false;

      if (groupTitle && conflictRoles.indexOf(groupTitle) === -1) {
        return;
      }

      hasConflict = groupTitle ?
        this.isCurrentGroupHasConflict(groupTitle, groups, conflictRoles) :
        this.isGroupsHasConflict(groups, conflictRoles);

      this.attr('hasConflicts', hasConflict);
      this.attr('instance').dispatch({
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
      let includeRoles = this.attr('includeRoles');
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
      const instance = this.attr('instance');
      const objectRoles = getRolesForType(instance.class.model_singular);

      return objectRoles.filter((item) => {
        return loIndexOf(includeRoles, item.name) > -1 &&
          loIndexOf(excludeRoles, item.name) === -1;
      });
    },
    filterByInclude(includeRoles) {
      const instance = this.attr('instance');
      const objectRoles = getRolesForType(instance.class.model_singular);

      return objectRoles.filter((item) =>
        loIndexOf(includeRoles, item.name) > -1);
    },
    filterByExclude(excludeRoles) {
      const instance = this.attr('instance');
      const objectRoles = getRolesForType(instance.class.model_singular);

      return objectRoles.filter((item) =>
        loIndexOf(excludeRoles, item.name) === -1);
    },
    getFilteredRoles() {
      const instance = this.attr('instance');
      const includeRoles = this.attr('includeRoles');
      const excludeRoles = this.attr('excludeRoles');
      let roles;

      if (includeRoles.length && excludeRoles.length) {
        roles = this.filterByIncludeExclude(includeRoles, excludeRoles);
      } else if (includeRoles.length) {
        roles = this.filterByInclude(includeRoles);
      } else if (excludeRoles.length) {
        roles = this.filterByExclude(excludeRoles);
      } else {
        roles = getRolesForType(instance.class.model_singular);
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
      let instance = this.attr('instance');

      if (!instance) {
        this.attr('rolesInfo', []);
        return;
      }

      roleAssignments = loGroupBy(instance
        .attr('access_control_list'), 'ac_role_id');

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

      if (this.attr('orderOfRoles.length')) {
        groups = this.setGroupOrder(groups, this.attr('orderOfRoles').attr());
      }

      return groups;
    },
    refreshPeopleInGroups() {
      let instance = this.attr('instance');
      let groups = this.attr('groups');
      let roleAssignments = loGroupBy(instance
        .attr('access_control_list'), 'ac_role_id');

      groups.forEach((group) =>
        group.attr('people', this.getPeople(roleAssignments, group.groupId)));
    },
    setupGroups() {
      this.attr('groups', this.getRoleList());
      this.checkConflicts();
    },
  }),
  events: {
    init() {
      this.viewModel.setupGroups();
    },
    '{viewModel.instance} updated'() {
      this.viewModel.refreshPeopleInGroups();
      this.viewModel.checkConflicts();
    },
    '{viewModel} instance'() {
      this.viewModel.setupGroups();
    },
  },
});
