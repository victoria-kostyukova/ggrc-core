/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {
  Proxy,
  Direct,
  Multi,
  CustomFilter,
} from './mapper-helpers';
import Mappings from './mappings';

const _workflowObjectTypes = [
  'Program', 'Regulation', 'Policy', 'Standard', 'Contract',
  'Requirement', 'Control', 'Objective', 'OrgGroup', 'Vendor', 'AccessGroup',
  'System', 'Process', 'DataAsset', 'Product', 'Project', 'Facility',
  'Market', 'Issue', 'Risk', 'Threat', 'Metric', 'TechnologyEnvironment',
  'ProductGroup'];

// Configure mapping extensions for ggrc_workflows
// Add mappings for basic workflow objects
let mappings = {
  TaskGroup: {
    /**
     * @property {string[]} _canonical.objects - "objects" is a mapper name.
     * This field contains collection of model names.
     */
    _canonical: {
      objects: _workflowObjectTypes,
    },
    /**
     * Mapper, which will be used for appropriate canonical mapper name
     * "objects".
     */
    objects: Proxy(
      null, 'object', 'TaskGroupObject', 'task_group',
      'task_group_objects'),
  },
  TaskGroupTask: {
    _related: ['Person', 'Workflow'],
  },
  Workflow: {
    _related: ['Person', 'TaskGroup', 'TaskGroupTask'],
  },
  CycleTaskGroupObjectTask: {
    _canonical: {
      // It is needed for an object list generation. This object list
      // describes which objects can be mapped to CycleTaskGroupObjectTask.
      // Types placed within this collection will be intersected
      // with GGRC.tree_view.base_widgets_by_type["CycleTaskGroupObjectTask"]
      // collection. The result of the operation is the total list.
      related_objects_as_source: _workflowObjectTypes.concat('Audit'),
    },
    _related: ['Person'],
    // Needed for related_objects mapper
    related_objects_as_source: Proxy(
      null,
      'destination', 'Relationship',
      'source', 'related_destinations'
    ),
    // Needed for related_objects mapper
    related_objects_as_destination: Proxy(
      null,
      'source', 'Relationship',
      'destination', 'related_sources'
    ),
    // Needed to show mapped objects for CycleTaskGroupObjectTask
    related_objects: Multi(
      ['related_objects_as_source', 'related_objects_as_destination']
    ),
    /**
     * "cycle", "cycle_task_entries" mappers are needed for mapped
     * comments and objects under CycleTaskGroupObjectTask into
     * mapping-tree-view component.
     */
    cycle: Direct(
      'Cycle', 'cycle_task_group_object_tasks', 'cycle'),
    cycle_task_entries: Direct(
      'CycleTaskEntry',
      'cycle_task_group_object_task',
      'cycle_task_entries'),
    /**
     * This mapping name is needed for objects mapped to CTGOT.
     * It helps to filter results of objects mapped to CTGOT.
     * We can just remove some objects from results.
     */
    info_related_objects: CustomFilter(
      'related_objects',
      function (relatedObjects) {
        return !_.includes([
          'CycleTaskGroup',
          'CycleTaskEntry',
          'Comment',
          'Document',
          'Person',
        ],
        relatedObjects.instance.type);
      }
    ),
  },
};

new Mappings('ggrc_workflows', mappings);
