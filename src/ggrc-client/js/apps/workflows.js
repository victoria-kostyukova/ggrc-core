/*
 * Copyright (C) 2018 Google Inc.
 * Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {
  initCounts,
  getPageInstance,
} from '../plugins/utils/current-page-utils';

import InfoWidget from '../controllers/info_widget_controller';
import {
  Proxy,
  Direct,
  Multi,
  TypeFilter,
  CustomFilter,
  Cross,
} from '../models/mappers/mapper-helpers';
import Mappings from '../models/mappers/mappings';
import Cycle from '../models/business-models/cycle';
import CycleTaskGroupObjectTask from '../models/business-models/cycle-task-group-object-task';
import TaskGroup from '../models/business-models/task-group';
import Workflow from '../models/business-models/workflow';
import Person from '../models/business-models/person';
import Stub from '../models/stub';
import * as businessModels from '../models/business-models';

(function ($, CMS, GGRC) {
  let WorkflowExtension = {};
  let _workflowObjectTypes = [
    'Program', 'Regulation', 'Policy', 'Standard', 'Contract',
    'Requirement', 'Control', 'Objective', 'OrgGroup', 'Vendor', 'AccessGroup',
    'System', 'Process', 'DataAsset', 'Product', 'Project', 'Facility',
    'Market', 'Issue', 'Risk', 'Threat', 'Metric', 'TechnologyEnvironment',
    'ProductGroup'];

  let historyWidgetCountsName = 'cycles:history';
  let currentWidgetCountsName = 'cycles:active';

  let historyWidgetFilter = 'is_current = 0';
  let currentWidgetFilter = 'is_current = 1';

  // Register `workflows` extension with GGRC
  GGRC.extensions.push(WorkflowExtension);

  WorkflowExtension.name = 'workflows';

  WorkflowExtension.countsMap = {
    history: {
      name: 'Cycle',
      countsName: historyWidgetCountsName,
      additionalFilter: historyWidgetFilter,
    },
    activeCycles: {
      name: 'Cycle',
      countsName: currentWidgetCountsName,
      additionalFilter: currentWidgetFilter,
    },
    taskGroup: 'TaskGroup',
  };


  // Configure mapping extensions for ggrc_workflows
  WorkflowExtension.init_mappings = function () {
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
        _related: ['Workflow'],
      },
      Workflow: {
        _related: ['TaskGroup', 'TaskGroupTask'],
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
      CycleTaskEntry: {
        related_objects_as_source: Proxy(
          null,
          'destination', 'Relationship',
          'source', 'related_destinations'
        ),
        related_objects_as_destination: Proxy(
          null,
          'source', 'Relationship',
          'destination', 'related_sources'
        ),
        related_objects: Multi(
          ['related_objects_as_source', 'related_objects_as_destination']
        ),
        destinations: Direct('Relationship', 'source', 'related_destinations'),
        sources: Direct('Relationship', 'destination', 'related_sources'),
        relationships: Multi(['sources', 'destinations']),
        documents: TypeFilter('related_objects', 'Document'),
        cycle: Direct(
          'Cycle', 'cycle_task_entries', 'cycle'),
        cycle_task_group_object_task: Direct(
          'CycleTaskGroupObjectTask',
          'cycle_task_entries',
          'cycle_task_group_object_task'),
        workflow: Cross('cycle', 'workflow'),
      },
    };

    // Insert `workflows` mappings to all business object types
    can.each(_workflowObjectTypes, function (type) {
      const workflowsMapper = Cross('task_groups', 'workflow');
      let model = businessModels[type];
      if (model === undefined || model === null) {
        return;
      }
      mappings[type] = {
        task_groups:
        new GGRC.ListLoaders.ProxyListLoader(
          'TaskGroupObject',
          'object',
          'task_group',
          'task_group_objects',
          null
        ),
        workflows: workflowsMapper,
        _canonical: {
          task_groups: 'TaskGroup',
        },
        orphaned_objects: Multi([
          Mappings.get_mappings_for(type).orphaned_objects,
          workflowsMapper,
        ]),
      };

      businessModels[type].attributes.task_group_objects = Stub.List;
    });
    new Mappings('ggrc_workflows', mappings);
  };

  // Override GGRC.extra_widget_descriptors and GGRC.extra_default_widgets
  // Initialize widgets for workflow page
  WorkflowExtension.init_widgets = function () {
    let pageInstance = getPageInstance();
    let treeWidgets = GGRC.tree_view.base_widgets_by_type;
    let subTrees = GGRC.tree_view.sub_tree_for;
    let models = ['TaskGroup', 'Workflow', 'CycleTaskEntry',
      'CycleTaskGroupObjectTask', 'CycleTaskGroupObject', 'CycleTaskGroup'];
    _.forEach(_workflowObjectTypes, function (type) {
      let widget;
      if (!type || !treeWidgets[type]) {
        return;
      }

      widget = subTrees[type];

      treeWidgets[type] = treeWidgets[type].concat(models);
      if (!_.isEmpty(subTrees.serialize)) {
        widget.attr({
          display_list: widget.display_list
            .concat(['CycleTaskGroupObjectTask']),
          model_list: widget.model_list
            .concat({
              display_name: CycleTaskGroupObjectTask.title_singular,
              display_status: true,
              model_name: 'CycleTaskGroupObjectTask',
            }),
        });
      }
    });

    const subTreeItems = ['Cycle'].concat(models);
    const updatedTreeWidgets = can.Map.keys(treeWidgets).concat(models);

    subTreeItems.forEach((item) => {
      treeWidgets.attr(item, updatedTreeWidgets);
      subTrees.attr(item, {
        display_list: updatedTreeWidgets,
        model_list: GGRC.tree_view.basic_model_list,
      });
    });

    if (pageInstance instanceof Workflow) {
      WorkflowExtension.init_widgets_for_workflow_page();
    } else if (pageInstance instanceof Person) {
      WorkflowExtension.init_widgets_for_person_page();
    } else {
      WorkflowExtension.init_widgets_for_other_pages();
    }
  };

  WorkflowExtension.init_widgets_for_other_pages = function () {
    let descriptor = {};
    let pageInstance = getPageInstance();

    if (
      pageInstance &&
      ~can.inArray(pageInstance.constructor.shortName, _workflowObjectTypes)
    ) {
      descriptor[pageInstance.constructor.shortName] = {
        Workflow: {
          widget_id: 'workflow',
          widget_name: 'Workflows',
          widgetType: 'treeview',
          treeViewDepth: 0,
          content_controller_options: {
            parent_instance: pageInstance,
            model: Workflow,
          },
        },
        CycleTaskGroupObjectTask: {
          widget_id: 'task',
          widget_name: 'Workflow Tasks',
          widgetType: 'treeview',
          treeViewDepth: 1,
          content_controller_options: {
            parent_instance: pageInstance,
            model: CycleTaskGroupObjectTask,
            add_item_view:
              GGRC.mustache_path +
              '/cycle_task_group_object_tasks/tree_add_item.mustache',
            draw_children: true,
          },
        },
      };
    }

    new GGRC.WidgetList('ggrc_workflows', descriptor);
  };

  WorkflowExtension.init_widgets_for_workflow_page = function () {
    let newWidgetDescriptors = {};
    let newDefaultWidgets = [
      'info', 'task_group', 'current', 'history',
    ];
    let historyWidgetDescriptor;
    let currentWidgetDescriptor;
    let object = getPageInstance();

    can.each(
      GGRC.WidgetList.get_current_page_widgets(),
      function (descriptor, name) {
        if (~newDefaultWidgets.indexOf(name)) {
          newWidgetDescriptors[name] = descriptor;
        }
      }
    );

    // Initialize controller -- probably this should go in a separate
    // initialization area
    $(document.body).ggrc_controllers_workflow_page();

    $.extend(
      true,
      newWidgetDescriptors,
      {
        info: {
          content_controller: InfoWidget,
          content_controller_options: {
            widget_view: GGRC.mustache_path + '/workflows/info.mustache',
          },
        },
        task_group: {
          widget_id: 'task_group',
          widget_name: 'Setup',
          widget_icon: 'task_group',
          widgetType: 'treeview',
          treeViewDepth: 0,
          model: TaskGroup,
          content_controller_options: {
            parent_instance: object,
            model: TaskGroup,
            sortable: true,
            draw_children: true,
          },
        },
      }
    );

    historyWidgetDescriptor = {
      widgetType: 'treeview',
      treeViewDepth: 3,
      widget_id: 'history',
      widget_name: 'History',
      widget_icon: 'history',
      model: Cycle,
      forceRefetch: true,
      content_controller_options: {
        depth: true,
        filterDeepLimit: 2,
        draw_children: true,
        parent_instance: object,
        model: Cycle,
        countsName: historyWidgetCountsName,
        additional_filter: historyWidgetFilter,
      },
    };

    currentWidgetDescriptor = {
      widgetType: 'treeview',
      treeViewDepth: 3,
      widget_id: 'current',
      widget_name: 'Active Cycles',
      widget_icon: 'cycle',
      model: Cycle,
      forceRefetch: true,
      content_controller_options: {
        depth: true,
        filterDeepLimit: 2,
        draw_children: true,
        parent_instance: object,
        model: Cycle,
        countsName: currentWidgetCountsName,
        additional_filter: currentWidgetFilter,
        add_item_view:
          GGRC.mustache_path +
          '/cycle_task_group_object_tasks/tree_add_item.mustache',
      },
    };

    newWidgetDescriptors.history = historyWidgetDescriptor;
    newWidgetDescriptors.current = currentWidgetDescriptor;

    initCounts([
      WorkflowExtension.countsMap.history,
      WorkflowExtension.countsMap.activeCycles,
      WorkflowExtension.countsMap.taskGroup,
    ],
    object.type,
    object.id);

    new GGRC.WidgetList(
      'ggrc_workflows',
      {Workflow: newWidgetDescriptors}
    );
  };

  WorkflowExtension.init_widgets_for_person_page = function () {
    let descriptor = {};
    let pageInstance = getPageInstance();
    const isObjectBrowser = /^\/objectBrowser\/?$/
      .test(window.location.pathname);
    const isPeoplePage = /^\/people\/.*$/
      .test(window.location.pathname);

    descriptor[pageInstance.constructor.shortName] = {
      CycleTaskGroupObjectTask: {
        widget_id: 'task',
        widgetType: 'treeview',
        treeViewDepth: 1,
        widget_name: 'My Tasks',
        model: CycleTaskGroupObjectTask,
        content_controller_options: {
          parent_instance: getPageInstance(),
          model: CycleTaskGroupObjectTask,
          add_item_view:
            GGRC.mustache_path +
            '/cycle_task_group_object_tasks/tree_add_item.mustache',
          draw_children: true,
          showBulkUpdate: !isObjectBrowser,
        },
      },
    };

    // add 'Workflows' tab for 'All Objects' and People view
    if (isObjectBrowser || isPeoplePage) {
      descriptor[pageInstance.constructor.shortName].Workflow = {
        widget_id: 'workflow',
        widget_name: 'Workflows',
        widgetType: 'treeview',
        treeViewDepth: 0,
        content_controller_options: {
          parent_instance: pageInstance,
          model: Workflow,
        },
      };
    }
    new GGRC.WidgetList('ggrc_workflows', descriptor);
  };

  WorkflowExtension.init_mappings();
})(window.can.$, window.CMS, window.GGRC);
