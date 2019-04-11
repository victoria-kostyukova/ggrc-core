/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import template from './cycle-task-objects.stache';
import Mappings from '../../../models/mappers/mappings';
import {
  loadObjectsByStubs,
  loadObjectsByTypes,
} from '../../../plugins/utils/query-api-utils';
import {
  DEFERRED_MAPPED_UNMAPPED,
  OBJECTS_MAPPED_VIA_MAPPER,
} from '../../../events/eventTypes';
import {notifier} from '../../../plugins/utils/notifiers-utils';
import {getAjaxErrorInfo} from '../../../plugins/utils/errors-utils';

const fields = ['id', 'type', 'title', 'viewLink'];

const viewModel = can.Map.extend({
  instance: null,
  mappedObjects: [],
  isLoading: false,
  convertToMappedObjects(objects) {
    return objects.map((object) => ({
      object,
      iconClass: `fa-${_.snakeCase(object.type)}`,
    }));
  },
  async initMappedObjects() {
    const mappingTypes = Mappings.getMappingList('CycleTaskGroupObjectTask');
    let rawMappedObjects;

    this.attr('isLoading', true);
    try {
      rawMappedObjects = await loadObjectsByTypes(
        this.attr('instance'),
        mappingTypes,
        fields,
      );
    } catch (xhr) {
      notifier('error', getAjaxErrorInfo(xhr).details);
      return;
    } finally {
      this.attr('isLoading', false);
    }

    this.attr('mappedObjects').replace(this.convertToMappedObjects(
      rawMappedObjects
    ));
  },
  async includeLoadedObjects(objects) {
    let loadedObjects;

    this.attr('isLoading', true);
    try {
      loadedObjects = await loadObjectsByStubs(objects, fields);
    } catch (xhr) {
      notifier('error', getAjaxErrorInfo(xhr).details);
      return;
    } finally {
      this.attr('isLoading', false);
    }

    this.attr('mappedObjects').push(...this.convertToMappedObjects(
      loadedObjects
    ));
  },
  excludeObjects(objects) {
    const mappedObjects = this.attr('mappedObjects');
    const withoutExcludedFilter = ({object: mappedObject}) => (
      _.findIndex(objects, (object) => (
        mappedObject.id === object.id &&
        mappedObject.type === object.type
      )) === -1
    );
    const objectsWithoutExcluded = mappedObjects.filter(withoutExcludedFilter);

    mappedObjects.replace(objectsWithoutExcluded);
  },
});

const init = function () {
  this.viewModel.initMappedObjects();
};

const events = {
  // When objects are mapped or/and unmapped via edit modal
  [`{viewModel.instance} ${DEFERRED_MAPPED_UNMAPPED.type}`](el, {
    mapped,
    unmapped,
  }) {
    const viewModel = this.viewModel;
    viewModel.excludeObjects(unmapped);
    viewModel.includeLoadedObjects(mapped);
  },
  [`{viewModel.instance} ${OBJECTS_MAPPED_VIA_MAPPER.type}`](el, {objects}) {
    this.viewModel.includeLoadedObjects(objects);
  },
};

export default can.Component.extend({
  tag: 'cycle-task-objects',
  view: can.stache(template),
  leakScope: true,
  viewModel,
  init,
  events,
});
