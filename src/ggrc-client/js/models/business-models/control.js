/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Cacheable from '../cacheable';
import '../mixins/unique-title';
import '../mixins/ca-update';
import '../mixins/timeboxed';
import '../mixins/access-control-list';
import '../mixins/base-notifications';
import '../mixins/proposable';
import '../mixins/assertions-categories';
import '../mixins/related-assessments-loader';
import Stub from '../stub';

export default Cacheable('CMS.Models.Control', {
  root_object: 'control',
  root_collection: 'controls',
  category: 'governance',
  findAll: 'GET /api/controls',
  findOne: 'GET /api/controls/{id}',
  create: 'POST /api/controls',
  update: 'PUT /api/controls/{id}',
  destroy: 'DELETE /api/controls/{id}',
  mixins: [
    'unique_title',
    'ca_update',
    'timeboxed',
    'accessControlList',
    'base-notifications',
    'proposable',
    'assertions_categories',
    'relatedAssessmentsLoader',
  ],
  is_custom_attributable: true,
  isRoleable: true,
  attributes: {
    context: Stub,
    modified_by: Stub,
    kind: Stub,
    means: Stub,
    verify_frequency: Stub,
  },
  links_to: {},
  defaults: {
    selected: false,
    title: '',
    slug: '',
    description: '',
    url: '',
    status: 'Draft',
  },
  tree_view_options: {
    attr_view: GGRC.mustache_path + '/controls/tree-item-attr.mustache',
    attr_list: Cacheable.attr_list.concat([
      {
        attr_title: 'Last Assessment Date',
        attr_name: 'last_assessment_date',
        order: 45, // between State and Primary Contact
      },
      {attr_title: 'Reference URL', attr_name: 'reference_url'},
      {attr_title: 'Effective Date', attr_name: 'start_date'},
      {attr_title: 'Last Deprecated Date', attr_name: 'end_date'},
      {
        attr_title: 'State',
        attr_name: 'status',
        order: 40,
      }, {
        attr_title: 'Kind/Nature',
        attr_name: 'kind',
        attr_sort_field: 'kind',
      },
      {attr_title: 'Fraud Related ', attr_name: 'fraud_related'},
      {attr_title: 'Significance', attr_name: 'significance'},
      {
        attr_title: 'Type/Means',
        attr_name: 'means',
        attr_sort_field: 'means',
      },
      {
        attr_title: 'Frequency',
        attr_name: 'frequency',
        attr_sort_field: 'verify_frequency',
      },
      {attr_title: 'Assertions', attr_name: 'assertions'},
      {attr_title: 'Categories', attr_name: 'categories'},
      {
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
      }]),
    display_attr_names: ['title', 'status', 'last_assessment_date',
      'updated_at'],
    add_item_view: GGRC.mustache_path + '/snapshots/tree_add_item.mustache',
    show_related_assessments: true,
    draw_children: true,
  },
  sub_tree_view_options: {
    default_filter: ['Objective'],
  },
  statuses: ['Draft', 'Deprecated', 'Active'],
  init: function () {
    this.validateNonBlank('title');

    this.validate('assertions', function () {
      if (!this.attr('assertions') || !this.attr('assertions.length')) {
        return 'cannot be blank';
      }
    });

    this._super(...arguments);
  },
}, {
  init: function () {
    let that = this;
    this._super(...arguments);
    this.bind('change', function (ev, attr, how, newVal, oldVal) {
      // Emit the 'orphaned' event when the directive attribute is removed
      if (attr === 'directive' && how === 'remove' && oldVal &&
        newVal === undefined) {
        // It is necessary to temporarily add the attribute back for orphaned
        // processing to work properly.
        that.directive = oldVal;
        can.trigger(that.constructor, 'orphaned', that);
        delete that.directive;
      }
    });
    this.bind('refreshInstance', this.refresh.bind(this));
  },
});
