/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import * as businessModels from '../../models/business-models';
import template from './business-object-list-item.stache';

/**
 * Mapped objects item view component
 */
export default canComponent.extend({
  tag: 'business-object-list-item',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    instance: {},
    define: {
      type: {
        type: String,
      },
      isSnapshot: {
        get() {
          return this.attr('instance.type') === 'Snapshot';
        },
      },
      iconCls: {
        get() {
          const objectType = !this.attr('isSnapshot') ?
            this.attr('instance.type') :
            this.attr('instance.child_type');
          const model = businessModels[objectType];
          return `fa-${model.table_singular}`;
        },
      },
      itemData: {
        get() {
          return !this.attr('isSnapshot') ?
            this.attr('instance') :
            this.attr('instance.revision.content');
        },
      },
      itemTitle: {
        get() {
          return this.attr('itemData.title') ||
            this.attr('itemData.name') ||
            this.attr('itemData.email') ||
            '<span class="empty-message">None</span>';
        },
      },
    },
  }),
});
