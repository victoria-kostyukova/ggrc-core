# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Workflow UI facade."""
from lib import url
from lib.entities import ui_dict_convert
from lib.page import dashboard
from lib.page.widget import workflow_tabs, task_group_info_panel, workflow_page
from lib.ui import internal_ui_operations, ui_facade
from lib.utils import selenium_utils


def create_workflow(workflow):
  """Creates a workflow `workflow`."""
  selenium_utils.open_url(url.dashboard())
  dashboard.Dashboard().start_workflow()
  internal_ui_operations.submit_obj(workflow)


def open_create_task_group_task_popup(task_group):
  """Opens task group task popup."""
  # pylint: disable=invalid-name
  setup_tab = workflow_tabs.SetupTab()
  setup_tab.open_via_url(task_group.workflow)
  setup_tab.open_create_task_group_task_modal(task_group)


def create_task_group_task(task_group_task):
  """Creates a task group task."""
  setup_tab = workflow_tabs.SetupTab()
  setup_tab.open_via_url(task_group_task.task_group.workflow)
  setup_tab.create_task_group_task(task_group_task)


def task_group_objs(workflow):
  """Returns task group titles of `workflow`."""
  setup_tab = workflow_tabs.SetupTab()
  setup_tab.open_via_url(workflow)
  return [ui_dict_convert.task_group_ui_to_app(task_group_row.obj_dict())
          for task_group_row in setup_tab.task_group_rows()]


def get_task_group_tasks_objs():
  """Returns task group tasks."""
  return [ui_dict_convert.task_group_task_ui_to_app(task_row.obj_dict())
          for task_row
          in task_group_info_panel.TaskGroupInfoPanel().task_rows()]


def add_obj_to_task_group(obj, task_group):
  """Map existing object `obj` to the task group `task_group`."""
  setup_tab = workflow_tabs.SetupTab()
  setup_tab.open_via_url(task_group.workflow)
  setup_tab.add_obj_to_task_group(obj=obj, task_group=task_group)


def get_objs_added_to_task_group(task_group):
  """Returns list of objects mapped to the task group."""
  setup_tab = workflow_tabs.SetupTab()
  setup_tab.open_via_url(task_group.workflow)
  return setup_tab.get_objs_added_to_task_group(task_group)


def delete_task_group(task_group):
  """Deletes task group."""
  setup_tab = workflow_tabs.SetupTab()
  setup_tab.open_via_url(task_group.workflow)
  setup_tab.delete_task_group(task_group)


def activate_workflow(workflow):
  """Activates workflow."""
  setup_tab = workflow_tabs.SetupTab()
  setup_tab.open_via_url(workflow)
  workflow_page.WorkflowPage().activate_workflow(
      is_workflow_repeat=bool(workflow.repeat_unit))


def get_workflow_cycles(workflow):
  """Builds and returns a tree of workflow cycles / cycle task groups
  / cycle tasks.
  """
  active_cycles_tab = workflow_tabs.ActiveCyclesTab()
  active_cycles_tab.open_via_url(workflow)
  return active_cycles_tab.get_workflow_cycles()


def map_obj_to_cycle_task(obj, cycle_task):
  """Maps object to the cycle task."""
  active_cycles_tab = workflow_tabs.ActiveCyclesTab()
  active_cycles_tab.open_via_url(
      cycle_task.task_group_task.task_group.workflow)
  active_cycles_tab.map_obj_to_cycle_task(obj=obj, cycle_task=cycle_task)


def get_objs_mapped_to_cycle_task(cycle_task):
  """Get objects mapped to the cycle task."""
  active_cycles_tab = workflow_tabs.ActiveCyclesTab()
  active_cycles_tab.open_via_url(
      cycle_task.task_group_task.task_group.workflow)
  return active_cycles_tab.get_objs_mapped_to_cycle_task(cycle_task)


def archive_workflow(workflow):
  """Archives workflow."""
  ui_facade.open_obj(workflow)
  internal_ui_operations.info_widget_cls(workflow).three_bbs.select_archive()
  workflow.is_archived = True
  workflow.recurrences_started = False
