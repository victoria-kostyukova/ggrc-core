/*
 * Copyright (C) 2020 Google Inc.
 * Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {
  getPageInstance,
} from '../plugins/utils/current-page-utils';
import {
  widgetModules,
  initCounts,
} from '../plugins/utils/widgets-utils';
import InfoWidget from '../controllers/info-widget-controller';
import WidgetList from '../modules/widget-list';
import Cycle from '../models/business-models/cycle';
import TaskGroup from '../models/business-models/task-group';
import Workflow from '../models/business-models/workflow';

let WorkflowExtension = {};

let historyWidgetCountsName = 'cycles:history';
let currentWidgetCountsName = 'cycles:active';

let historyWidgetFilter = 'is_current = 0';
let currentWidgetFilter = 'is_current = 1';

// Register `workflows` extension with GGRC
widgetModules.push(WorkflowExtension);

WorkflowExtension.name = 'workflows';

let countsMap = {
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

// Initialize widgets for workflow page
WorkflowExtension.init_widgets = function () {
  let pageInstance = getPageInstance();

  if (pageInstance instanceof Workflow) {
    WorkflowExtension.init_widgets_for_workflow_page();
  }
};

WorkflowExtension.init_widgets_for_workflow_page = function () {
  let descriptors = {};
  let object = getPageInstance();


  $.extend(
    true,
    descriptors,
    {
      info: {
        content_controller: InfoWidget,
        content_controller_options: {
          widget_view: '/workflows/info.stache',
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
          countsName: countsMap.taskGroup,
        },
      },
    }
  );

  let historyWidgetDescriptor = {
    widgetType: 'treeview',
    treeViewDepth: 3,
    widget_id: 'history',
    widget_name: 'History',
    widget_icon: 'history',
    model: Cycle,
    content_controller_options: {
      forceRefetch: true,
      depth: true,
      filterDeepLimit: 2,
      parent_instance: object,
      model: Cycle,
      countsName: historyWidgetCountsName,
      additional_filter: historyWidgetFilter,
    },
  };

  let currentWidgetDescriptor = {
    widgetType: 'treeview',
    treeViewDepth: 3,
    widget_id: 'current',
    widget_name: 'Active Cycles',
    widget_icon: 'cycle',
    model: Cycle,
    content_controller_options: {
      forceRefetch: true,
      depth: true,
      filterDeepLimit: 2,
      parent_instance: object,
      model: Cycle,
      countsName: currentWidgetCountsName,
      additional_filter: currentWidgetFilter,
      add_item_view: 'cycle_task_group_object_tasks/tree-add-item',
    },
  };

  descriptors.history = historyWidgetDescriptor;
  descriptors.current = currentWidgetDescriptor;

  initCounts([
    countsMap.history,
    countsMap.activeCycles,
    countsMap.taskGroup,
  ],
  object.type,
  object.id);

  new WidgetList(
    'ggrc_workflows',
    {Workflow: descriptors}
  );
};

export {
  countsMap,
};
