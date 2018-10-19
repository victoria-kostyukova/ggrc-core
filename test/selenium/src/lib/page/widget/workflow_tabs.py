# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Workflow top tabs."""
from lib.page.modal import object_mapper
from lib.page.widget import (
    task_group_info_panel, object_modal, workflow_tree_widgets, object_page)
from lib.utils import test_utils


class ActiveCyclesTab(object_page.ObjectPage):
  """Active Cycles tab."""

  @staticmethod
  def _url_fragment():
    """See superclass."""
    return "current"

  @property
  def _tree_widget(self):
    """Returns tree widget with active cycles."""
    return workflow_tree_widgets.WorkflowCycleTreeWidget(
        container=self._browser.section(id=self._url_fragment()))

  def get_workflow_cycles(self):
    """Expands the tree, then builds and returns a list of WorkflowCycle entity
    objects.
    """
    workflow_cycles = []
    for workflow_cycle_row in self._tree_widget.workflow_cycle_rows():
      workflow_cycle_row.expand()
      for cycle_task_group_row in workflow_cycle_row.cycle_task_group_rows():
        cycle_task_group_row.expand()
      workflow_cycles.append(workflow_cycle_row.build_obj_with_tree())
    return workflow_cycles


class SetupTab(object_page.ObjectPage):
  """Setup tab."""

  @staticmethod
  def _url_fragment():
    """See superclass."""
    return "task_group"

  @property
  def _task_group_tree(self):
    """Returns tree widget with task groups."""
    return workflow_tree_widgets.SetupTaskGroupTree(
        container=self._browser.section(id=self._url_fragment()))

  def wait_to_be_init(self):
    """Waits for page to be fully initialized."""
    rows = self.task_group_rows()

    def is_assignee_set():
      """Assignee column is one of the last places to be init on the page."""
      return rows[-1].text_for_header("Assignee") != ""
    if rows:
      test_utils.wait_for(is_assignee_set)

  def open_task_group(self, task_group):
    """Opens task group."""
    self._task_group_tree.get_tree_item_by(title=task_group.title).select()

  def open_create_task_group_task_modal(self, task_group):
    """Opens a Create Task modal."""
    # pylint: disable=invalid-name
    self.open_task_group(task_group)
    self._task_group_panel.click_create_task()

  def create_task_group_task(self, task_group_task):
    """Creates a task group task on the tab."""
    self.open_create_task_group_task_modal(task_group_task.task_group)
    object_modal.get_modal_obj("task_group_task").submit_obj(task_group_task)

  def add_obj_to_task_group(self, obj, task_group):
    """Adds object to the task group."""
    self.open_task_group(task_group)
    self._task_group_panel.click_add_obj()
    object_mapper.ObjectMapper().map_obj(obj)

  def get_objs_added_to_task_group(self, task_group):
    """Returns objects added to the task group."""
    self.open_task_group(task_group)
    return self._task_group_panel.added_objs()

  def delete_task_group(self, task_group):
    """Deletes task group."""
    self.open_task_group(task_group)
    self._task_group_panel.click_to_edit()
    object_modal.get_modal_obj("task_group_task").delete()

  def task_group_rows(self):
    """Returns task group rows."""
    return self._task_group_tree.tree_items()

  @property
  def _task_group_panel(self):
    """Returns task group info panel."""
    panel = task_group_info_panel.TaskGroupInfoPanel()
    panel.wait_to_be_init()
    return panel
