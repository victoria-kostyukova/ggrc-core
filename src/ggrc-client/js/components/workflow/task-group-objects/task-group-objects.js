/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loSnakeCase from 'lodash/snakeCase';
import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './templates/task-group-objects.stache';
import {OBJECTS_MAPPED_VIA_MAPPER} from '../../../events/event-types';
import {unmapObjects} from '../../../plugins/utils/mapper-utils';
import {notifier} from '../../../plugins/utils/notifiers-utils';
import {
  loadObjectsByStubs,
  loadObjectsByTypes,
} from '../../../plugins/utils/query-api-utils';

import Stub from '../../../models/stub';
import {getMappingList} from '../../../models/mappers/mappings';
import {getAjaxErrorInfo} from '../../../plugins/utils/errors-utils';
import loFind from 'lodash/find';

const requiredObjectsFields = ['id', 'type', 'title'];

const viewModel = canMap.extend({
  canEdit: false,
  taskGroup: null,
  items: [],
  addToList(objects) {
    let newItems = objects.map((object) => this.convertToListItem(object));
    if (this.attr('taskGroup._pendingUnmappings')) {
      const pendingItems = this.attr('taskGroup._pendingUnmappings')
        .map(({item}) => item);
      newItems = newItems.map((item) => {
        const isFound = loFind(pendingItems, {
          id: item.stub.id,
          type: item.stub.type,
        });
        if (isFound) {
          item.unmapping = true;
          item.disabled = true;
        }
        return item;
      });
    }
    this.attr('items').push(...newItems);
  },
  getPending() {
    return this.attr('taskGroup._pendingUnmappings') || [];
  },

  convertToListItem(object) {
    return {
      stub: new Stub(object),
      title: object.title,
      iconClass: `fa-${loSnakeCase(object.type)}`,
      disabled: false,
      unmapping: false,
    };
  },
  async initTaskGroupItems() {
    const mappingTypes = getMappingList('TaskGroup');
    const mappedObjects = await loadObjectsByTypes(
      this.attr('taskGroup'),
      mappingTypes,
      requiredObjectsFields
    );
    this.addToList(mappedObjects);
    this.waitForResolveOfPendingItems();
  },
  async waitForResolveOfPendingItems() {
    for (const pending of Array.from(this.getPending())) {
      const items = this.attr('items');
      const index = Array.from(items).findIndex((x) =>
        x.stub.id === pending.item.id &&
        x.stub.type === pending.item.type
      );
      if (index > -1) {
        await pending.request;
        items.splice(index, 1);
      }

      const pendingItems = this.getPending();
      pendingItems.splice(pendingItems.indexOf(pending), 1);
    }
  },
  async addPreloadedObjectsToList(stubs) {
    const loadedObjects = await loadObjectsByStubs(
      stubs,
      requiredObjectsFields
    );
    this.addToList(loadedObjects);
  },
  async unmapByItemIndex(itemIndex) {
    const items = this.attr('items');
    const item = items[itemIndex];

    item.attr('disabled', true);
    item.attr('unmapping', true);

    const pending = {
      request: unmapObjects(this.attr('taskGroup'), [item.attr('stub')]),
      item: {
        id: item.stub.id,
        type: item.stub.type,
      },
    };
    if (!this.attr('taskGroup._pendingUnmappings')) {
      this.attr('taskGroup._pendingUnmappings', []);
    }
    this.attr('taskGroup._pendingUnmappings').push(pending);

    try {
      await pending.request;
    } catch (xhr) {
      notifier('error', getAjaxErrorInfo(xhr).details);
      return;
    } finally {
      item.attr('disabled', false);
      item.attr('unmapping', false);
    }

    // remove unmapped object from the list
    // Need to get updated index because
    // "items" collection can be changed
    // in case when the user unmaps several objects -
    // "itemIndex" will store old index of item.
    items.splice(items.indexOf(item), 1);
    notifier('success', 'Unmap successful.');

    const pendingItems = this.getPending();
    pendingItems.splice(pendingItems.indexOf(pending), 1);
  },
});

const events = {
  [`{viewModel.taskGroup} ${OBJECTS_MAPPED_VIA_MAPPER.type}`](el, {objects}) {
    this.viewModel.addPreloadedObjectsToList(objects);
  },
  '.task-group-objects__unmap click'(el) {
    this.viewModel.unmapByItemIndex(el.attr('data-item-index'));
  },
};

const init = function () {
  this.viewModel.initTaskGroupItems();
};

export default canComponent.extend({
  tag: 'task-group-objects',
  view: canStache(template),
  leakScope: true,
  viewModel,
  events,
  init,
});
