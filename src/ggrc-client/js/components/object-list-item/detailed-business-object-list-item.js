/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import '../related-objects/related-people-access-control';
import '../related-objects/related-people-access-control-group';
import '../people/deletable-people-group';
import {
  getParentUrl,
} from '../../plugins/utils/snapshot-utils';
import '../custom-attributes/custom-attributes-field-view';
import '../related-objects/related-people-access-control';
import template from './detailed-business-object-list-item.stache';

const VISIBLE_ROLES = {
  Control: ['Admin', 'Control Operators', 'Control Owners', 'Other Contacts'],
  Risk: ['Admin', 'Risk Owners', 'Other Contacts'],
};

/**
 * Assessment specific mapped objects popover view component
 */
export default canComponent.extend({
  tag: 'detailed-business-object-list-item',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    instance: {},
    customAttributes: null,
    deletableAdmin: false,
    define: {
      isSnapshot: {
        get: function () {
          return this.attr('instance.type') === 'Snapshot';
        },
      },
      itemData: {
        get: function () {
          return this.attr('isSnapshot') ?
            this.attr('instance.revision.content') :
            this.attr('instance');
        },
      },
      objectLink: {
        get: function () {
          return this.attr('isSnapshot') ?
            getParentUrl(this.attr('instance')) :
            this.attr('itemData.viewLink');
        },
      },
      objectTitle: {
        get: function () {
          return this.attr('itemData.title') ||
            this.attr('itemData.name') ||
            this.attr('itemData.email') || false;
        },
      },
      visibleRoles: {
        get: function () {
          const defaultList = [
            'Admin', 'Primary Contacts', 'Secondary Contacts',
          ];
          return VISIBLE_ROLES[this.attr('itemData.type')] || defaultList;
        },
      },
    },
  }),
});
