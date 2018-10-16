# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Workflow top tabs."""
from lib.page.modal import object_mapper
from lib.page.widget import tree_widget, task_group_info_panel, object_modal
from lib.ui import internal_ui_operations
from lib.utils import test_utils


class SetupTab(object):
  """Setup tab."""

  def __init__(self):
    self._task_group_tree = TaskGroupTree()

  @staticmethod
  def open_via_url(workflow):
    """Opens Setup tab via URL."""
    internal_ui_operations.open_obj_tab_via_url(workflow, "task_group")

  def wait_to_be_init(self):
    """Wait for page to be fully initialized."""
    def is_assignee_set():
      """Assignee column is one of the last places to be init on the page."""
      return self.task_group_rows()[-1].text_for_header("Assignee") != ""
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


class TaskGroupTree(tree_widget.TreeWidget):
  """Represents tree of TaskGroups."""

  def __init__(self):
    super(TaskGroupTree, self).__init__(table_row_cls=TaskGroupTreeItem)


class TaskGroupTreeItem(tree_widget.TreeItem):
  """Represents a row of task group."""

  def __init__(self, row_el, table_header_names):
    super(TaskGroupTreeItem, self).__init__(
        row_el=row_el,
        table_header_names=table_header_names,
        header_attr_mapping={"Summary": "title"}
    )
