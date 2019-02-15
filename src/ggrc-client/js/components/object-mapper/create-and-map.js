/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import template from './create-and-map.stache';
import {
  MAP_OBJECTS,
} from '../../events/eventTypes';
import {
  isAuditScopeModel,
  isSnapshotModel,
  isSnapshotParent,
} from '../../plugins/utils/snapshot-utils';
import Permission from '../../permission';

export default can.Component.extend({
  tag: 'create-and-map',
  template,
  leakScope: false,
  viewModel: {
    define: {
      sourceType: {
        get() {
          return this.attr('source').constructor.model_singular;
        },
      },
      destinationType: {
        get() {
          return this.attr('destinationModel').model_singular;
        },
      },
      allowedToCreate: {
        get() {
          let source = this.attr('sourceType');
          let destination = this.attr('destinationType');
          let isInAuditScopeSrc = isAuditScopeModel(source);
          let isSnapshotParentSrc = isSnapshotParent(source);
          let isSnapshotParentDst = isSnapshotParent(destination);
          let isSnapshotModelSrc = isSnapshotModel(source);
          let isSnapshotModelDst = isSnapshotModel(destination);

          let result =
            Permission.is_allowed_any('create', destination) &&
            // Don't allow if source is Audit scope model (Asmt) and destination is snapshotable
            !((isInAuditScopeSrc && isSnapshotModelDst) ||
              // Don't allow if source is snapshotParent (Audit) and destination is snapshotable.
              (isSnapshotParentSrc && isSnapshotModelDst) ||
              // Don't allow if destination is snapshotParent (Audit) and source is snapshotable.
              (isSnapshotParentDst && isSnapshotModelSrc));

          return result;
        },
      },
    },
    source: null,
    destinationModel: null,
    newEntries: [],
    resetEntries() {
      this.attr('newEntries', []);
    },
    mapObjects() {
      this.attr('source')
        .dispatch({
          ...MAP_OBJECTS,
          objects: this.attr('newEntries'),
        });
    },
  },
  events: {
    // clicked Save & Close button in Create modal
    '.create-control modal:success': function (el, ev, model) {
      this.viewModel.attr('newEntries').push(model);
      this.viewModel.mapObjects();
    },
    // clicked Save & Add another button in Create modal
    '.create-control modal:added': function (el, ev, model) {
      this.viewModel.attr('newEntries').push(model);
    },
    // clicked Discard button in Discard Changes modal
    '.create-control modal:dismiss'() {
      this.viewModel.mapObjects();
    },
    // clicked Esc or close btn in Create modal and modal closed without Discard changes modal
    '{window} modal:dismiss'(el, ev, options) {
      let source = this.viewModel.attr('source');

      // mapper sets uniqueId for modal-ajax.
      // we can check using unique id which modal-ajax is closing
      if (options && options.uniqueId && source.id === options.uniqueId
        && this.viewModel.attr('newEntries').length) {
        this.viewModel.mapObjects();
      }
    },
  },
});
