/*
 * Copyright (C) 2018 Google Inc.
 * Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {
  initCounts,
  getPageInstance,
} from '../plugins/utils/current-page-utils';
import {registerHook} from '../plugins/ggrc_utils';

import InfoWidget from '../controllers/info_widget_controller';
import {
  Proxy,
  Direct,
  Multi,
  TypeFilter,
  CustomFilter,
  Reify,
  Cross,
} from '../models/mappers/mapper-helpers';
import Mappings from '../models/mappers/mappings';
import CycleTaskEntry from '../models/service-models/cycle-task-entry';
import Cycle from '../models/business-models/cycle';
import CycleTaskGroup from '../models/business-models/cycle-task-group';
import CycleTaskGroupObjectTask from '../models/business-models/cycle-task-group-object-task';
import TaskGroup from '../models/business-models/task-group';
import Workflow from '../models/business-models/workflow';
import Person from '../models/business-models/person';

(function ($, CMS, GGRC) {
  let WorkflowExtension = {};
  let _workflowObjectTypes = Array.prototype.concat.call(
    [],
    'Program Regulation Policy Standard Contract Clause Requirement'.split(' '),
    'Control Objective OrgGroup Vendor AccessGroup'.split(' '),
    'System Process DataAsset Product Project Facility Market'.split(' '),
    'Issue Risk Threat Metric TechnologyEnvironment ProductGroup'.split(' ')
  );

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

  // Register Workflow models for use with `inferObjectType`
  WorkflowExtension.object_type_decision_tree = function () {
    return {
      cycle: Cycle,
      cycle_task_entry: CycleTaskEntry,
      cycle_task_group: CycleTaskGroup,
      cycle_task_group_object_task: CycleTaskGroupObjectTask,
      task_group: TaskGroup,
      workflow: Workflow,
    };
  };

  // Configure mapping extensions for ggrc_workflows
  WorkflowExtension.init_mappings = function () {
    // Add mappings for basic workflow objects
    let mappings = {
      TaskGroup: {
        _canonical: {
          objects: _workflowObjectTypes.concat(['Cacheable']),
        },
        task_group_tasks: Direct(
          'TaskGroupTask', 'task_group', 'task_group_tasks'),
        objects: Proxy(
          null, 'object', 'TaskGroupObject', 'task_group',
          'task_group_objects'),
        workflow: Direct(
          'Workflow', 'task_groups', 'workflow'),
      },

      Workflow: {
        _canonical: {
          context: 'Context',
        },
        task_groups: Direct(
          'TaskGroup', 'workflow', 'task_groups'),
        tasks: Cross(
          'task_groups', 'task_group_tasks'),
        cycles: Direct(
          'Cycle', 'workflow', 'cycles'),
        previous_cycles: CustomFilter('cycles', function (result) {
          return !result.instance.attr('is_current');
        }),
        current_cycle: CustomFilter('cycles', function (result) {
          return result.instance.attr('is_current');
        }),
        current_task_groups: Cross('current_cycle', 'cycle_task_groups'),
        current_tasks: Cross(
          'current_task_groups', 'cycle_task_group_object_tasks'
        ),
        current_all_tasks: Cross(
          'current_task_groups', 'cycle_task_group_tasks'
        ),
        context: Direct(
          'Context', 'related_object', 'context'),
      },

      Cycle: {
        cycle_task_groups: Direct(
          'CycleTaskGroup', 'cycle', 'cycle_task_groups'),
        reify_cycle_task_groups: Reify('cycle_task_groups'),
        workflow: Direct('Workflow', 'cycles', 'workflow'),
      },

      CycleTaskGroup: {
        cycle: Direct(
          'Cycle', 'cycle_task_groups', 'cycle'),
        cycle_task_group_tasks: Direct(
          'CycleTaskGroupObjectTask',
          'cycle_task_group',
          'cycle_task_group_tasks'),

        // effectively an alias for 'cycle_task_group_tasks', specifying just
        // the latter's name as a string does not work for some reason
        cycle_task_group_object_tasks: Direct(
          'CycleTaskGroupObjectTask',
          'cycle_task_group',
          'cycle_task_group_tasks'),
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
        related_access_groups: TypeFilter('related_objects', 'AccessGroup'),
        related_data_assets: TypeFilter('related_objects', 'DataAsset'),
        related_facilities: TypeFilter('related_objects', 'Facility'),
        related_markets: TypeFilter('related_objects', 'Market'),
        related_metrics: TypeFilter('related_objects', 'Metric'),
        related_org_groups: TypeFilter('related_objects', 'OrgGroup'),
        related_vendors: TypeFilter('related_objects', 'Vendor'),
        related_processes: TypeFilter('related_objects', 'Process'),
        related_products: TypeFilter('related_objects', 'Product'),
        related_product_groups: TypeFilter('related_objects', 'ProductGroup'),
        related_projects: TypeFilter('related_objects', 'Project'),
        related_systems: TypeFilter('related_objects', 'System'),
        related_issues: TypeFilter('related_objects', 'Issue'),
        related_audits: TypeFilter('related_objects', 'Audit'),
        related_controls: TypeFilter('related_objects', 'Control'),
        related_documents: TypeFilter('related_objects', 'Document'),
        related_technology_environments: TypeFilter('related_objects',
          'TechnologyEnvironment'),
        regulations: TypeFilter('related_objects', 'Regulation'),
        contracts: TypeFilter('related_objects', 'Contract'),
        policies: TypeFilter('related_objects', 'Policy'),
        standards: TypeFilter('related_objects', 'Standard'),
        programs: TypeFilter('related_objects', 'Program'),
        controls: TypeFilter('related_objects', 'Control'),
        requirements: TypeFilter('related_objects', 'Requirement'),
        clauses: TypeFilter('related_objects', 'Clause'),
        objectives: TypeFilter('related_objects', 'Objective'),
        cycle: Direct(
          'Cycle', 'cycle_task_group_object_tasks', 'cycle'),
        cycle_task_group: Direct(
          'CycleTaskGroup',
          'cycle_task_group_object_tasks',
          'cycle_task_group'),
        cycle_task_entries: Direct(
          'CycleTaskEntry',
          'cycle_task_group_object_task',
          'cycle_task_entries'),

        info_related_objects: CustomFilter(
          'related_objects',
          function (relatedObjects) {
            return !_.includes(
              ['Comment', 'Document', 'Person'],
              relatedObjects.instance.type
            );
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
      let model = CMS.Models[type];
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
        workflows: Cross('task_groups', 'workflow'),
        approval_workflows: CustomFilter('workflows', function (binding) {
          return binding.instance.attr('object_approval');
        }),
        current_approval_cycles: Cross('approval_workflows', 'current_cycle'),
        _canonical: {
          workflows: 'Workflow',
          task_groups: 'TaskGroup',
        },
      };
      mappings[type].orphaned_objects = Multi([
        Mappings.get_mappings_for(type).orphaned_objects,
        mappings[type].workflows,
      ]);

      CMS.Models[type].attributes.task_group_objects =
        'CMS.Models.TaskGroupObject.stubs';
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

  registerHook(
    'Dashboard.Widgets', GGRC.mustache_path + '/dashboard/widgets');

  WorkflowExtension.init_mappings();
})(window.can.$, window.CMS, window.GGRC);
