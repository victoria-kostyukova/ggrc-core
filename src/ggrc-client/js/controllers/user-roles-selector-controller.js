/*
  Copyright (C) 2019 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loSortBy from 'lodash/sortBy';
import {ggrcAjax} from '../plugins/ajax_extensions';
import makeArray from 'can-util/js/make-array/make-array';
import canStache from 'can-stache';
import canList from 'can-list';
import canMap from 'can-map';
import canControl from 'can-control';
import Role from '../models/service-models/role';
import Person from '../models/business-models/person';
import UserRole from '../models/service-models/user-role';

// Role Assignment Modal Selector
const userRolesModalSelector = canControl.extend({
  defaults: {
    base_modal_view:
      GGRC.templates_path + '/people_roles/base_modal.stache',
    option_column_view: 'people_roles/option_column',
    object_detail_view: 'people_roles/object_detail',

    personId: null,
  },

  launch($trigger, options) {
    let $target = $(
      '<div id="ajax-modal-user-roles" class="modal modal-selector hide"></div>'
    );

    $target.modal_form({}, $trigger);
    this.newInstance($target[0], options);
    return $target;
  },
}, {
  init() {
    this.rolesList = new canList();
    this.userRolesList = new canList();

    this.initContext();
    this.initView();
    this.initData();
  },

  '.option_column li click': 'selectOption',
  '.confirm-buttons a.btn click': 'changeOption',

  initView() {
    let deferred = $.Deferred();

    ggrcAjax({
      url: this.options.base_modal_view,
      dataType: 'text',
    }).then((view) => {
      let frag = canStache(view)(this.context);
      $(this.element).html(frag);
      $(this.element).trigger('loaded');
      deferred.resolve();
    });

    this.on(); // Start listening for events

    return deferred;
  },

  initData() {
    return $.when(
      this.refreshPerson(),
      this.refreshRoles(),
      this.refreshUserRole(),
    );
  },

  initContext() {
    this.context = new canMap($.extend({
      rolesList: this.rolesList,
      selectedPerson: null,
      selectedOption: null,
    }, this.options));
  },

  refreshPerson() {
    return Person.findOne({id: this.options.personId})
      .then((person) => {
        this.context.attr('selectedPerson', person);
      });
  },

  refreshRoles() {
    let params = {
      scope__in: 'System,Admin',
    };

    return Role.findAll(
      params,
      (options) => {
        options = makeArray(loSortBy(options, 'role_order'));
        const description =
          'This role allows a user access to the MyWork dashboard and ' +
          'applications Help files.';

        options.unshift({
          name: 'No role',
          id: 0,
          description,
          scope: 'System',
        });
        this.rolesList.replace(options);
      });
  },

  refreshUserRole() {
    return UserRole.findAll({person_id: this.options.personId},
      (userRoles) => {
        this.userRolesList.replace(userRoles);
        this.updateSelectedOption();
      });
  },

  updateSelectedOption() {
    if (!this.userRolesList.length) {
      this.context.attr('selectedOption', 0);
      return;
    }

    let id = this.userRolesList[0].role.id;
    this.context.attr('selectedOption', id);
  },

  selectOption(el) {
    this.context.attr('selectedOption', el.data('option'));
  },

  changeOption() {
    let clickedOption = this.context.attr('selectedOption');
    let deleteDfd = $.Deferred().resolve();

    // Look for and remove the existing join.
    let existingUserRole = this.getExistingUserRole();
    if (existingUserRole) {
      if (existingUserRole.role.id !== clickedOption.id) {
        deleteDfd = existingUserRole.refresh()
          .then(() => {
            return existingUserRole.destroy();
          })
          .then(() => {
            this.refreshPerson();
          });
      } else {
        // haven't changed
        return;
      }
    }

    // Create the new join (skipping "No Role" role, with id == 0)
    if (clickedOption.id > 0) {
      deleteDfd
        .then(() => {
          let userRole = this.getUserRole(
            clickedOption.id,
            clickedOption.scope,
          );
          return userRole.save();
        })
        .then((userRole) => {
          this.userRolesList.replace([userRole]);
          this.refreshPerson();
        });
    }
  },

  // HELPERS
  getExistingUserRole() {
    if (!this.userRolesList.length) {
      return null;
    }

    return this.userRolesList[0];
  },

  getUserRole(optionId, optionScope) {
    let joinParams = {
      role: {
        id: optionId,
        type: 'Role',
      },
      person: {
        id: this.getPerson().id,
        type: 'Person',
      },
      context: {id: null},
    };

    if (optionScope === 'Admin') {
      joinParams.context = {id: 0, type: 'Context'};
    }

    return new UserRole(joinParams);
  },

  getPerson() {
    return this.context.attr('selectedPerson');
  },
});

export default userRolesModalSelector;
