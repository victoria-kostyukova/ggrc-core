/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loForEach from 'lodash/forEach';
import {confirm} from '../../plugins/utils/modals';
import {refreshPermissions} from '../../permission';
import Cycle from '../../models/business-models/cycle';
import Stub from '../../models/stub';
import {changeHash} from '../../router';
import {getMappingList} from '../../models/mappers/mappings';
import {refreshAll} from '../../models/refresh-queue';

/**
 * A set of properties which describe minimum information
 * about cycle.
 * @typedef {Object} CycleStub
 * @property {number} id - cycle id.
 * @property {string} type - cycle type.
 * @example
 * // stub for cycle
 * const cycleStub = {
 *  id: 123,
 *  type: "Cycle",
 * };
 */

/**
 * Creates cycle instance.
 * @param {Workflow} workflow - a workflow instance.
 * @return {Cycle} - a new cycle based on workflow.
 */
function createCycle(workflow) {
  return new Cycle({
    context: new Stub(workflow.context),
    workflow: new Stub(workflow),
    autogenerate: true,
  });
}

/**
 * Redirects to cycle tab.
 */
function redirectToCycle() {
  changeHash({
    widget: 'current',
  });
}

/**
 * Redirects to history tab.
 */
function redirectToHistory() {
  changeHash({
    widget: 'history',
  });
}

function generateCycle(workflow) {
  return new Promise((resolve, reject) => {
    confirm({
      modal_title: 'Confirm',
      modal_confirm: 'Proceed',
      skip_refresh: true,
      button_view: '/workflows/confirm-start-buttons.stache',
      content_view: '/workflows/confirm-start.stache',
      instance: workflow,
    }, (params) => {
      let data = {};

      loForEach(params, function (item) {
        data[item.name] = item.value;
      });

      const cycle = createCycle(workflow);

      cycle.save().then((cycle) => {
        // Cycle created. Workflow started.
        setTimeout(() => {
          resolve();
          redirectToCycle(cycle);
        }, 250);
      });
    }, reject);
  });
}

async function updateStatus(instance, status) {
  // we refresh the instance, because without this
  // the server will return us 409 error
  const refreshed = await instance.refresh();
  refreshed.attr('status', status);
  return refreshed.save();
}

function refreshTGRelatedItems(taskGroup) {
  refreshPermissions();
  refreshAll(taskGroup, ['workflow', 'context'], true);
}

function getRelevantMappingTypes(instance) {
  const mappingTypes = getMappingList(instance.constructor.model_singular);
  const typesSet = new Set();
  const relatedObjects = [
    ...Array.from(instance.attr('related_destinations')),
    ...Array.from(instance.attr('related_sources')),
  ];

  relatedObjects.forEach(({destination_type: type}) => {
    if (mappingTypes.includes(type)) {
      typesSet.add(type);
    }
  });

  return [...typesSet];
}

export {
  createCycle,
  redirectToCycle,
  redirectToHistory,
  generateCycle,
  updateStatus,
  refreshTGRelatedItems,
  getRelevantMappingTypes,
};
