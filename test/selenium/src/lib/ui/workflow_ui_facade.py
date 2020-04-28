# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Workflow UI facade."""
# pylint: disable=invalid-name

from lib import url, users
from lib.app_entity_factory import (workflow_entity_factory,
                                    person_entity_factory)
from lib.constants import object_states
from lib.entities import cycle_entity_population, ui_dict_convert
from lib.page import dashboard
from lib.page.widget import (
    workflow_tabs, task_group_info_panel, workflow_page, object_modal)
from lib.ui import internal_ui_operations, ui_facade
from lib.utils import selenium_utils


def create_workflow(workflow):
  """Creates a workflow `workflow`."""
  selenium_utils.open_url(url.dashboard())
  dashboard.Dashboard().start_workflow()
  internal_ui_operations.submit_obj(workflow)


def open_create_task_group_task_popup(task_group):
  """Opens task group task popup."""
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


def add_task_group(workflow, task_group):
  """Adds task group."""
  workflow_tabs.SetupTab().open_via_url(workflow)
  dashboard.Dashboard().start_task_group()
  object_modal.get_modal_obj("task_group").submit_obj(task_group)


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
  active_cycles_tab.open_using_cycle_task(cycle_task)
  active_cycles_tab.map_obj_to_cycle_task(obj=obj, cycle_task=cycle_task)


def get_objs_mapped_to_cycle_task(cycle_task):
  """Get objects mapped to the cycle task."""
  active_cycles_tab = workflow_tabs.ActiveCyclesTab()
  active_cycles_tab.open_using_cycle_task(cycle_task)
  return active_cycles_tab.get_objs_mapped_to_cycle_task(cycle_task)


def add_assignee_to_cycle_task(assignee, cycle_task):
  """Adds the assignee to the cycle task."""
  active_cycles_tab = workflow_tabs.ActiveCyclesTab()
  active_cycles_tab.open_using_cycle_task(cycle_task)
  active_cycles_tab.add_assignee_to_cycle_task(
      assignee=assignee, cycle_task=cycle_task)
  cycle_task.assignees.append(assignee)


def add_comment_to_cycle_task(comment, cycle_task):
  """Adds a comment to the cycle task."""
  active_cycles_tab = workflow_tabs.ActiveCyclesTab()
  active_cycles_tab.open_using_cycle_task(cycle_task)
  active_cycles_tab.add_comment_to_cycle_task(
      comment=comment, cycle_task=cycle_task)
  comment.modified_by = users.current_person()
  cycle_task.comments.append(comment)


def get_cycle_task(cycle_task):
  """Returns Task Assignees of cycle task."""
  active_cycles_tab = workflow_tabs.ActiveCyclesTab()
  active_cycles_tab.open_using_cycle_task(cycle_task)
  return active_cycles_tab.get_cycle_task(cycle_task)


def start_cycle_task(cycle_task):
  """Starts the cycle task."""
  active_cycles_tab = workflow_tabs.ActiveCyclesTab()
  active_cycles_tab.open_using_cycle_task(cycle_task)
  active_cycles_tab.start_cycle_task(cycle_task)
  cycle_task.state = object_states.IN_PROGRESS
  cycle_entity_population.propagate_task_state_change(cycle_task)


def archive_workflow(workflow):
  """Archives workflow."""
  ui_facade.open_obj(workflow)
  info_widget = internal_ui_operations.info_widget_page(workflow)
  info_widget.archive()
  workflow.is_archived = True
  workflow.recurrences_started = False
  workflow.modified_by = users.current_person()


def check_creating_of_task_group(soft_assert, app_workflow):
  """Checks a task group is created."""
  task_group = workflow_entity_factory.TaskGroupFactory().create()
  add_task_group(app_workflow, task_group)
  task_group_with_ui_representation = (
      workflow_entity_factory.TaskGroupFactory().create_empty(
          title=task_group.title,
          assignee=person_entity_factory.PersonFactory().create_empty(
              email=task_group.assignee.email),
          description=task_group.description))
  soft_assert.expect(any(
      actual_task_group == task_group_with_ui_representation
      for actual_task_group in task_group_objs(app_workflow)),
      "Task group {} should be present.".format(
          task_group_with_ui_representation.title))


def check_create_task_modal_appeared(soft_assert, activated_workflow):
  """Checks a create cycle task modal is appeared on the Active Cycles Tab."""
  active_cycles_tab = workflow_tabs.ActiveCyclesTab()
  active_cycles_tab.open_via_url(activated_workflow)
  soft_assert.expect(
      active_cycles_tab.open_create_cycle_task_modal().is_present,
      "A Create Cycle modal should be present.")
