/*
 Copyright (C) 2020 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import './mandatory-fields-modal';
import {
  buildModifiedACL,
  buildModifiedListField,
} from '../../plugins/utils/object-history-utils';
import template from './templates/restore-revision.stache';

export default canComponent.extend({
  tag: 'restore-revision',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    instance: {},
    restoredRevision: {},
    loading: false,
    modalState: {open: false},
    restore(element) {
      const instance = this.attr('instance');
      const diff = this.attr('restoredRevision.diff_with_current');
      let attrValues;

      if (!diff || !instance) {
        return;
      }

      this.attr('loading', true);
      attrValues = diff.attr('custom_attribute_values');

      this.applyFields(instance, diff.attr('fields'));
      this.applyFields(instance, diff.attr('mapping_fields'));
      this.applyAcl(instance, diff.attr('access_control_list'));
      this.applyListFields(instance, diff.attr('mapping_list_fields'));

      // use legacy approach to save custom attribute
      this.applyCustomAttributes(instance, attrValues);

      if (instance.validateGCAs()) {
        this.saveInstance(element);
      } else {
        // fill in mandatory fields
        this.attr('modalState.open', true);
      }
    },
    saveInstance(element) {
      this.attr('instance').save().then(() => {
        this.attr('loading', false);

        this.closeDiff(element);
        this.attr('modalState.open', false);
      });
    },
    applyFields(instance, modifiedFields) {
      const fieldNames = canMap.keys(modifiedFields);

      fieldNames.forEach((fieldName) => {
        const modifiedField = modifiedFields[fieldName];
        instance.attr(fieldName, modifiedField);
      });
    },
    applyAcl(instance, modifiedRoles) {
      const modifiedACL = buildModifiedACL(instance, modifiedRoles);
      instance.attr('access_control_list', modifiedACL);
    },
    applyListFields(instance, modifiedFields) {
      const fieldNames = canMap.keys(modifiedFields);
      fieldNames.forEach((fieldName) => {
        const items = instance.attr(fieldName);
        const modifiedItems = modifiedFields.attr(fieldName);
        const modifiedField = buildModifiedListField(items, modifiedItems);
        instance.attr(fieldName, modifiedField);
      });
    },
    applyCustomAttributes(instance, modifiedAttributes) {
      modifiedAttributes.each((modifiedAttribute, caId) => {
        instance.customAttr(caId, modifiedAttribute.attribute_value);
      });
    },
    closeDiff(element) {
      // TODO: fix
      $(element).closest('.modal').find('.modal-dismiss').trigger('click');
    },
    revertChanges() {
      this.attr('instance').restore(true);
      this.attr('loading', false);
    },
  }),
});
