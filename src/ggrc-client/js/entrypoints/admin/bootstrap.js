/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loTrim from 'lodash/trim';
import makeArray from 'can-util/js/make-array/make-array';
import canList from 'can-list';
import {
  initWidgets,
} from '../../plugins/utils/widgets-utils';
import '../../controllers/dashboard_controller';
import {RouterConfig} from '../../router';
import routes from './routes';
import {gapiClient} from '../../plugins/ggrc-gapi-client';
import Event from '../../models/service-models/event';
import Role from '../../models/service-models/role';
import CustomAttributable from '../../models/custom-attributes/custom-attributable';
import CustomAttributeDefinition from '../../models/custom-attributes/custom-attribute-definition';
import AccessControlRole from '../../models/custom-roles/access-control-role';
import Roleable from '../../models/custom-roles/roleable';
import Person from '../../models/business-models/person';
import WidgetList from '../../modules/widget_list';
import ListView from '../../controllers/tree/list_view_controller';
import TreeViewControl from '../../controllers/tree/tree-view';
import {DashboardControl} from '../../controllers/dashboard_controller';

const sortByNameEmail = (list) => {
  return new list.constructor(makeArray(list).sort(function (a, b) {
    a = a.person || a;
    b = b.person || b;
    a = (loTrim(a.name) || loTrim(a.email)).toLowerCase();
    b = (loTrim(b.name) || loTrim(b.email)).toLowerCase();
    if (a > b) {
      return 1;
    }
    if (a < b) {
      return -1;
    }
    return 0;
  }));
};

RouterConfig.setupRoutes(routes);
gapiClient.loadGapiClient();

const adminListDescriptors = {
  people: {
    model: Person,
    roles: new canList(),
    init: function () {
      let self = this;
      Role
        .findAll({scope__in: 'System,Admin'})
        .done(function (roles) {
          self.roles.replace(sortByNameEmail(roles));
        });
    },
    object_display: 'People',
    header_view:
    // includes only the filter, not the column headers
      '/static/templates/people/filters.stache',
    list_view: '/static/templates/people/object_list.stache',
    fetch_post_process: sortByNameEmail,
  },
  roles: {
    model: Role,
    extra_params: {scope__in: 'System,Admin,Private Program,Workflow'},
    object_category: 'governance',
    object_display: 'Roles',
    list_view: '/static/templates/roles/object_list.stache',
    fetch_post_process: sortByNameEmail,
  },
  events: {
    model: Event,
    object_category: 'governance',
    object_display: 'Events',
    list_view: '/static/templates/events/object_list.stache',
  },
  custom_attributes: {
    parent_instance: CustomAttributable,
    model: CustomAttributable,
    header_view:
    GGRC.templates_path +
    '/custom_attribute_definitions/tree_header.stache',
    show_view:
    GGRC.templates_path + '/custom_attribute_definitions/tree.stache',
    sortable: false,
    list_loader: function () {
      return CustomAttributable.findAll();
    },
    child_options: [{
      model: CustomAttributeDefinition,
      mapping: 'custom_attribute_definitions',
      show_view:
      GGRC.templates_path +
      '/custom_attribute_definitions/subtree.stache',
      add_item_view: null,
    }],
  },
  custom_roles: {
    parent_instance: Roleable,
    model: Roleable,
    header_view:
    GGRC.templates_path + '/access_control_roles/tree_header.stache',
    show_view:
    GGRC.templates_path + '/access_control_roles/tree.stache',
    sortable: false,
    list_loader: function () {
      return Roleable.findAll();
    },
    child_options: [{
      model: AccessControlRole,
      mapping: 'access_control_roles',
      show_view:
      GGRC.templates_path + '/access_control_roles/subtree.stache',
      add_item_view: null,
    }],
  },
};

new WidgetList('ggrc_admin', {
  admin: {
    people: {
      model: Person,
      content_controller: ListView,
      content_controller_options: adminListDescriptors.people,
      widget_id: 'people_list',
      widget_icon: 'person',
      show_filter: false,
      widget_name() {
        return 'People';
      },
      widget_info() {
        return '';
      },
    },
    roles: {
      model: Role,
      content_controller: ListView,
      content_controller_options: adminListDescriptors.roles,
      widget_id: 'roles_list',
      widget_icon: 'role',
      show_filter: false,
      widget_name() {
        return 'Roles';
      },
      widget_info() {
        return '';
      },
    },
    events: {
      model: Event,
      content_controller: ListView,
      content_controller_options: adminListDescriptors.events,
      widget_id: 'events_list',
      widget_icon: 'event',
      widget_name() {
        return 'Events';
      },
      widget_info() {
        return '';
      },
    },
    custom_attributes: {
      model: CustomAttributable,
      content_controller: TreeViewControl,
      content_controller_options: adminListDescriptors.custom_attributes,
      widget_id: 'custom_attribute',
      widget_icon: 'workflow',
      widget_name() {
        return 'Custom Attributes';
      },
      content_controller_selector: 'ul',
      widget_initial_content:
        '<ul class="tree-structure new-tree colored-list tree-view-control"' +
        ' data-no-pin="true">' +
        '</ul>',
    },
    custom_roles: {
      model: Roleable,
      content_controller: TreeViewControl,
      content_controller_options: adminListDescriptors.custom_roles,
      widget_id: 'custom_roles',
      widget_icon: 'unlock',
      widget_name() {
        return 'Custom Roles';
      },
      content_controller_selector: 'ul',
      widget_initial_content:
        '<ul class="tree-structure new-tree colored-list tree-view-control"' +
        ' data-no-pin="true">' +
        '</ul>',
    },
  },
});

new DashboardControl('#pageContent', {
  widget_descriptors: WidgetList.get_widget_list_for('admin'),
  menu_tree_spec: GGRC.admin_menu_spec,
  header_view: `${GGRC.templates_path}/base_objects/page_header.stache`,
  innernav_view: `${GGRC.templates_path}/base_objects/inner-nav.stache`,
  default_widgets: [
    'people', 'roles', 'events', 'custom_attributes', 'custom_roles',
  ],
});

initWidgets();
