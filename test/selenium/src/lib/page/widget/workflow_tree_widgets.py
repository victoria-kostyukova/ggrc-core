# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Tree widgets on workflow tabs."""
from lib.page.widget import tree_widget, table_with_headers
from lib.page.widget.tree_widget import TreeWidget
from lib.page.widget.workflow_tree_rows import (
    WorkflowCycleRow, SetupTaskGroupTreeItem)


class WorkflowCycleTreeWidget(TreeWidget):
  """Represents tree widget on workflow Active Cycles / History tab."""
  # pylint: disable=too-few-public-methods

  def __init__(self, container):
    super(WorkflowCycleTreeWidget, self).__init__(
        container=container, table_row_cls=WorkflowCycleRow)

  @property
  def create_task_btn(self):
    return self._root.element(
        css="[data-original-title='Create Cycle Task for object']")

  def workflow_cycle_rows(self):
    """Returns workflow cycle rows."""
    return self.tree_items()

  def get_workflow_cycle_row_by(self, **conditions):
    """Returns a workflow cycle row by conditions."""
    return table_with_headers.get_sub_row_by(
        rows=self.workflow_cycle_rows, **conditions)


class SetupTaskGroupTree(tree_widget.TreeWidget):
  """Represents tree of TaskGroups."""

  def __init__(self, container):
    super(SetupTaskGroupTree, self).__init__(
        container=container, table_row_cls=SetupTaskGroupTreeItem)
