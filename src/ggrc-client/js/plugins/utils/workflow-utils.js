/*
  Copyright (C) 2019 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loForEach from 'lodash/forEach';
import {confirm} from '../../plugins/utils/modals';
import Permission from '../../permission';
import Cycle from '../../models/business-models/cycle';
import Stub from '../../models/stub';
import {changeHash} from '../../router';
import {getMappingList} from '../../models/mappers/mappings';

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
  let dfd = new $.Deferred();
  let cycle;

  confirm({
    modal_title: 'Confirm',
    modal_confirm: 'Proceed',
    skip_refresh: true,
    button_view: GGRC.templates_path +
      '/workflows/confirm_start_buttons.stache',
    content_view: GGRC.templates_path +
      '/workflows/confirm_start.stache',
    instance: workflow,
  }, (params, option) => {
    let data = {};

    loForEach(params, function (item) {
      data[item.name] = item.value;
    });

    cycle = createCycle(workflow);

    cycle.save().then((cycle) => {
      // Cycle created. Workflow started.
      setTimeout(() => {
        dfd.resolve();
        redirectToCycle(cycle);
      }, 250);
    });
  }, function () {
    dfd.reject();
  });
  return dfd;
}

async function updateStatus(instance, status) {
  // we refresh the instance, because without this
  // the server will return us 409 error
  const refreshed = await instance.refresh();
  refreshed.attr('status', status);
  return refreshed.save();
}

function refreshTGRelatedItems(taskGroup) {
  Permission.refresh();
  taskGroup.refresh_all_force('workflow', 'context');
}

function getRelevantMappingTypes(instance) {
  const mappingTypes = getMappingList(instance.constructor.model_singular);
  const typesSet = new Set();
  const relatedObjects = [
    ...instance.attr('related_destinations'),
    ...instance.attr('related_sources'),
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
