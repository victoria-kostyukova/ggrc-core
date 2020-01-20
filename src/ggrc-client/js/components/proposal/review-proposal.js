/*
 Copyright (C) 2020 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import {
  buildModifiedACL,
  buildModifiedListField,
  buildModifiedAttValues,
} from '../../plugins/utils/object-history-utils';
import Revision from '../../models/service-models/revision';

import template from './templates/review-proposal.stache';

export default canComponent.extend({
  tag: 'review-proposal',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      buttonView: {
        get() {
          return '/modals/review-proposal.stache';
        },
      },
      canReview: {
        get() {
          return this.attr('proposal.status') !== 'applied';
        },
      },
    },
    leftRevisionId: null,
    rightRevision: null,
    proposal: {},
    instance: {},
    isLoading: false,
    modalTitle: 'Review: Compare to Current',
    prepareComparerConfig() {
      const instance = this.attr('instance');
      const leftRevisionId = this.attr('leftRevisionId');
      const rightRevision = this.attr('rightRevision');
      let query;

      this.attr('isLoading', true);

      if (leftRevisionId && rightRevision) {
        this.attr('isLoading', false);

        // revisions are already ready
        this.openRevisionComparer();
        return;
      }

      query = {
        __sort: '-updated_at',
        __page: 1,
        __page_size: 1,
        resource_type: instance.attr('type'),
        resource_id: instance.attr('id'),
      };

      // get last revision
      Revision.findAll(query).then((data) => {
        const originalRevision = data[0];
        this.attr('leftRevisionId', originalRevision.id);
        this.buildModifiedRevision(originalRevision);
      });
    },
    buildModifiedRevision(originalRevision) {
      const diff = this.attr('proposal.content');
      const diffAttributes = diff.custom_attribute_values;
      const rightRevision = new canMap({
        id: originalRevision.id,
        content: Object.assign({}, originalRevision.content.attr()),
      });

      const modifiedContent = rightRevision.content;

      this.applyFields(modifiedContent, diff.fields);
      this.applyFields(modifiedContent, diff.mapping_fields);
      this.applyAcl(modifiedContent, diff.access_control_list);
      this.applyListFields(modifiedContent, diff.mapping_list_fields);
      this.applyCustomAttributes(modifiedContent, diffAttributes);

      this.attr('rightRevision', rightRevision);
      this.attr('isLoading', false);
      this.openRevisionComparer();
    },
    applyFields(instance, modifiedFields) {
      const fieldNames = canMap.keys(modifiedFields);

      fieldNames.forEach((fieldName) => {
        const modifiedField = modifiedFields[fieldName];
        instance[fieldName] = modifiedField;
      });
    },
    applyAcl(instance, modifiedRoles) {
      const modifiedACL = buildModifiedACL(instance, modifiedRoles);
      instance.access_control_list = modifiedACL;
    },
    applyListFields(instance, modifiedFields) {
      const fieldNames = canMap.keys(modifiedFields);
      fieldNames.forEach((fieldName) => {
        const items = instance[fieldName];
        const modifiedItems = modifiedFields[fieldName];
        const modifiedField = buildModifiedListField(items, modifiedItems);
        instance[fieldName] = modifiedField;
      });
    },
    applyCustomAttributes(instance, modifiedAttributes) {
      const values = instance
        .custom_attribute_values
        .attr()
        .map((val) => {
          // mark as stub
          val.isStub = true;
          return val;
        });

      const definitions = instance
        .custom_attribute_definitions
        .attr();

      const modifiedValues =
        buildModifiedAttValues(values, definitions, modifiedAttributes);

      instance.custom_attribute_values = modifiedValues;
    },
    openRevisionComparer() {
      const el = this.attr('$el');
      const revisionsComparer = el.find('revisions-comparer');
      if (revisionsComparer && revisionsComparer.viewModel) {
        revisionsComparer.viewModel().compareIt();
      }
    },
  }),
  events: {
    inserted() {
      this.viewModel.attr('$el', this.element);
    },
    '{viewModel.instance} modelAfterSave'() {
      // reset 'leftRevisionId' after instance saving to get the latest revision
      this.viewModel.attr('leftRevisionId', null);
    },
  },
});
