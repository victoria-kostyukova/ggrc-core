/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loSnakeCase from 'lodash/snakeCase';
import loFindIndex from 'lodash/findIndex';
import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './cycle-task-objects.stache';
import {
  loadObjectsByStubs,
  loadObjectsByTypes,
} from '../../../plugins/utils/query-api-utils';
import {
  DEFERRED_MAPPED_UNMAPPED,
  OBJECTS_MAPPED_VIA_MAPPER,
} from '../../../events/eventTypes';
import {getRelevantMappingTypes} from '../../../plugins/utils/workflow-utils';
import {notifier} from '../../../plugins/utils/notifiers-utils';
import {getAjaxErrorInfo} from '../../../plugins/utils/errors-utils';

const fields = ['id', 'type', 'title', 'viewLink'];

const viewModel = canMap.extend({
  instance: null,
  mappedObjects: [],
  isLoading: false,
  convertToMappedObjects(objects) {
    return objects.map((object) => ({
      object,
      iconClass: `fa-${loSnakeCase(object.type)}`,
    }));
  },
  async initMappedObjects() {
    const instance = this.attr('instance');

    this.attr('isLoading', true);
    try {
      const rawMappedObjects = await loadObjectsByTypes(
        instance,
        getRelevantMappingTypes(instance),
        fields,
      );
      this.attr('mappedObjects').replace(this.convertToMappedObjects(
        rawMappedObjects
      ));
    } catch (xhr) {
      notifier('error', getAjaxErrorInfo(xhr).details);
    } finally {
      this.attr('isLoading', false);
    }
  },
  async includeLoadedObjects(objects) {
    this.attr('isLoading', true);
    try {
      const loadedObjects = await loadObjectsByStubs(objects, fields);

      this.attr('mappedObjects').push(...this.convertToMappedObjects(
        loadedObjects
      ));
    } catch (xhr) {
      notifier('error', getAjaxErrorInfo(xhr).details);
    } finally {
      this.attr('isLoading', false);
    }
  },
  withoutExcludedFilter: (objects, {object: mappedObject}) => {
    return loFindIndex(objects, (object) => (
      mappedObject.id === object.id &&
      mappedObject.type === object.type
    )) === -1;
  },
  excludeObjects(objects) {
    const mappedObjects = this.attr('mappedObjects');
    const objectsWithoutExcluded = mappedObjects
      .filter((mappedObject) =>
        this.withoutExcludedFilter(objects, mappedObject));

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

export default canComponent.extend({
  tag: 'cycle-task-objects',
  view: canStache(template),
  leakScope: true,
  viewModel,
  init,
  events,
});
