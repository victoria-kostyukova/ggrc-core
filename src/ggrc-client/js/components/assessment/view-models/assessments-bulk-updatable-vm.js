/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canList from 'can-list';
import ObjectOperationsBaseVM from '../../view-models/object-operations-base-vm';
import {
  notifier,
  connectionLostNotifier,
} from '../../../plugins/utils/notifiers-utils';
import {trackStatus} from '../../../plugins/utils/background-task-utils';
import {
  create,
  setDefaultStatusConfig,
} from '../../../plugins/utils/advanced-search-utils';
import {getAvailableAttributes} from '../../../plugins/utils/tree-view-utils';
import {isConnectionLost} from '../../../plugins/utils/errors-utils';

export default ObjectOperationsBaseVM.extend({
  showSearch: {
    value: false,
  },
  isMyAssessmentsView: {
    value: false,
  },
  mappedToItems: {
    value: () => [],
  },
  filterItems: {
    Type: canList,
    value: () => [],
  },
  defaultFilterItems: {
    Type: canList,
    value: () => [],
  },
  mappingItems: {
    Type: canList,
    value: () => [],
  },
  filterAttributes: {
    value: () => [],
  },
  type: {
    value: 'Assessment',
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
  element: {
    value: null,
  },
  statesCollectionKey: {
    value: null,
  },
  getSelectedAssessmentsIds() {
    return this.selected.serialize().map((selected) => selected.id);
  },
  initDefaultFilter({
    attribute,
    options: attributeOptions = null,
  }, operatorOptions = null) {
    const stateConfig = setDefaultStatusConfig(
      this.type,
      this.statesCollectionKey
    );
    const items = [
      create.state(stateConfig),
      create.operator('AND', operatorOptions),
      create.attribute(attribute, attributeOptions),
    ];

    this.filterItems = items;
    this.defaultFilterItems = items;
  },
  initFilterAttributes() {
    const attributes = getAvailableAttributes(this.type)
      .filter(({attr_name: attrName}) => attrName !== 'status');

    this.filterAttributes = attributes;
  },
  trackBackgroundTask(taskId) {
    notifier('progress', 'Your bulk update is submitted. ' +
        'Once it is done you will get a notification. ' +
        'You can continue working with the app.');
    const url = `/api/background_tasks/${taskId}`;
    trackStatus(
      url,
      () => this.onSuccessHandler(),
      () => this.onFailureHandler());
  },
  handleBulkUpdateErrors() {
    if (isConnectionLost()) {
      connectionLostNotifier();
    } else {
      notifier('error', 'Bulk update is failed. ' +
      'Please refresh the page and start bulk update again.');
    }
  },
  onSuccessHandler() {
    const reloadLink = window.location.origin
    + window.location.pathname
    + '#!assessment&state%5B%5D=Completed+and+Verified';
    notifier('success', 'Bulk update is finished successfully. {reload_link}',
      {reloadLink});
  },
  onFailureHandler() {
    notifier('error', 'Bulk update is failed.');
  },
  closeModal() {
    this.element.find('.modal-dismiss').trigger('click');
  },
});
