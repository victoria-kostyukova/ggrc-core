/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canComponent from 'can-component';
import * as businessModels from '../../../models/business-models';
import MappingOperationsVM from '../../view-models/mapping-operations-vm';
import {loadObjectsByTypes} from '../../../plugins/utils/query-api-utils';
import {notifier} from '../../../plugins/utils/notifiers-utils';
import {getAjaxErrorInfo} from '../../../plugins/utils/errors-utils';
import {getRelevantMappingTypes} from '../../../plugins/utils/workflow-utils';

/**
 * @typedef {Object} Stub
 * @property {number} id - id of a pre-mapped object
 * @property {string} type - type of a pre-mapped object
 */

const viewModel = MappingOperationsVM.extend({
  instance: null,
  isNewInstance: false,
  /**
  * @type {Stub[]}
  */
  preMappedStubs: [],
  /**
  * @type {Cacheable[]}
  */
  preMappedObjects: [],
  mappingsList: [],
  fields: ['id', 'type', 'title', 'viewLink'],
  isLoading: false,
  loadPreMappedObjects() {
    return this.attr('preMappedStubs').map((stub) =>
      businessModels[stub.type].findInCacheById(stub.id)
    );
  },
  loadMappedObjects() {
    const instance = this.attr('instance');
    const fields = this.attr('fields').attr();
    return loadObjectsByTypes(
      instance,
      getRelevantMappingTypes(instance),
      fields
    );
  },
  async init() {
    this.attr('preMappedObjects', this.loadPreMappedObjects());

    this.attr('mappingsList').push(...this.attr('preMappedObjects').attr());

    if (this.attr('isNewInstance')) {
      return;
    }

    this.attr('isLoading', true);
    try {
      const mappedObjects = await this.loadMappedObjects();
      this.attr('mappingsList').push(...mappedObjects);
    } catch (xhr) {
      notifier('error', getAjaxErrorInfo(xhr).details);
    } finally {
      this.attr('isLoading', false);
    }
  },
});

export default canComponent.extend({
  tag: 'cycle-task-modal',
  leakScope: true,
  viewModel,
});
