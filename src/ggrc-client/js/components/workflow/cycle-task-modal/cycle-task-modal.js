/*
  Copyright (C) 2019 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Mappings from '../../../models/mappers/mappings';
import * as businessModels from '../../../models/business-models';
import {loadObjectsByTypes} from '../../../plugins/utils/query-api-utils';

/**
 * @typedef {Object} Stub
 * @property {number} id - id of a pre-mapped object
 * @property {string} type - type of a pre-mapped object
 */

const viewModel = can.Map.extend({
  instance: null,
  /**
  * @type {Cacheable[]}
  */
  mappedObjects: [],
  /**
  * @type {Stub[]}
  */
  preMappedStubs: [],
  /**
  * @type {Cacheable[]}
  */
  preMappedObjects: [],
  loadPreMappedObjects() {
    return this.attr('preMappedStubs').map((stub) =>
      businessModels[stub.type].findInCacheById(stub.id)
    );
  },
  loadMappedObjects() {
    const mappingTypes = Mappings.getMappingList('CycleTaskGroupObjectTask');
    const fields = ['id', 'type', 'title'];
    return loadObjectsByTypes(this.attr('instance'), mappingTypes, fields);
  },
  async init() {
    this.attr('preMappedObjects', this.loadPreMappedObjects());
    this.attr('mappedObjects', await this.loadMappedObjects());
  },
});

export default can.Component.extend({
  tag: 'cycle-task-modal',
  leakScope: true,
  viewModel,
});
