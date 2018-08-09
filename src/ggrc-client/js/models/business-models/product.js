/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Cacheable from '../cacheable';
import '../mixins/unique-title';
import '../mixins/ca-update';
import '../mixins/timeboxed';
import '../mixins/access-control-list';
import '../mixins/scope-object-notifications';
import '../mixins/questionnaire';
import Stub from '../stub';

export default Cacheable('CMS.Models.Product', {
  root_object: 'product',
  root_collection: 'products',
  category: 'business',
  findAll: 'GET /api/products',
  findOne: 'GET /api/products/{id}',
  create: 'POST /api/products',
  update: 'PUT /api/products/{id}',
  destroy: 'DELETE /api/products/{id}',
  mixins: [
    'unique_title',
    'ca_update',
    'timeboxed',
    'accessControlList',
    'scope-object-notifications',
    'questionnaire',
  ],
  is_custom_attributable: true,
  isRoleable: true,
  attributes: {
    context: Stub,
    modified_by: Stub,
    kind: Stub,
  },
  tree_view_options: {
    attr_view: GGRC.mustache_path + '/base_objects/tree-item-attr.mustache',
    attr_list: Cacheable.attr_list.concat([
      {attr_title: 'Kind/Type', attr_name: 'type', attr_sort_field: 'kind'},
      {attr_title: 'Reference URL', attr_name: 'reference_url'},
      {attr_title: 'Last Deprecated Date', attr_name: 'end_date'},
      {
        attr_title: 'Launch Status',
        attr_name: 'status',
        order: 40,
      }, {
        attr_title: 'Description',
        attr_name: 'description',
        disable_sorting: true,
      }, {
        attr_title: 'Notes',
        attr_name: 'notes',
        disable_sorting: true,
      }, {
        attr_title: 'Assessment Procedure',
        attr_name: 'test_plan',
        disable_sorting: true,
      },
    ]),
    add_item_view:
      GGRC.mustache_path + '/base_objects/tree_add_item.mustache',
  },
  sub_tree_view_options: {
    default_filter: ['System'],
  },
  links_to: {
    System: {},
    Process: {},
    Program: {},
    Product: {},
    Facility: {},
    OrgGroup: {},
    Vendor: {},
    Project: {},
    DataAsset: {},
    AccessGroup: {},
    Market: {},
  },
  defaults: {
    status: 'Draft',
    kind: null,
  },
  statuses: ['Draft', 'Deprecated', 'Active'],
  init: function () {
    if (this._super) {
      this._super(...arguments);
    }

    this.validateNonBlank('title');
  },
}, {});
