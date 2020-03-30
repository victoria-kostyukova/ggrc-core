/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canComponent from 'can-component';
import '../../components/advanced-search/advanced-search-filter-container';
import '../../components/advanced-search/advanced-search-filter-state';
import '../../components/advanced-search/advanced-search-wrapper';
import '../../components/unified-mapper/mapper-results';
import '../../components/collapsible-panel/collapsible-panel';
import './bulk-update-target-state';
import {getBulkStatesForModel} from '../../plugins/utils/state-utils';
import ObjectOperationsBaseVM from '../view-models/object-operations-base-vm';
import template from './object-bulk-update.stache';
import tracker from '../../tracker';

export default canComponent.extend({
  tag: 'object-bulk-update',
  view: canStache(template),
  leakScope: true,
  viewModel(attrs, parentViewModel) {
    let type = attrs.type;
    let targetStates = getBulkStatesForModel(type);
    let targetState = targetStates.length ? targetStates[0] : null;
    let defaultSort = [
      {
        key: 'task due date',
        direction: 'asc',
      },
      {
        key: 'Task Assignees',
        direction: 'asc',
      },
      {
        key: 'task title',
        direction: 'asc',
      },
    ];

    return ObjectOperationsBaseVM.extend({
      type: {
        value: attrs.type,
        /*
        * When object type is changed it should be needed to change a config.
        * For example, if not set a special config for type [TYPE] then is used
        * general config, otherwise special config.
        */
        set(mapType) {
          if (mapType === this.type) {
            return mapType;
          }
          this.setNewType(mapType);
          return mapType;
        },
      },
      object: {
        value: () => attrs.object,
      },
      reduceToOwnedItems: {
        value: true,
      },
      showTargetState: {
        value: true,
      },
      targetStates: {
        value: () => targetStates,
      },
      targetState: {
        value: targetState,
      },
      defaultSort: {
        value: () => defaultSort,
      },
      callback: {
        value: () => parentViewModel.attr('callback'),
      },
      element: {
        value: null,
      },
      closeModal() {
        if (this.element) {
          this.element.find('.modal-dismiss').trigger('click');
        }
      },
      performUpdate() {
        const stopFn = tracker.start(
          this.type,
          tracker.USER_JOURNEY_KEYS.LOADING,
          tracker.USER_ACTIONS.CYCLE_TASK.BULK_UPDATE);

        this.callback(this, {
          selected: this.selected,
          options: {
            state: this.targetState,
          },
        }).then(stopFn, stopFn.bind(null, true));
      },
    });
  },
  events: {
    inserted() {
      this.viewModel.element = this.element;
      this.viewModel.onSubmit();
    },
  },
});
