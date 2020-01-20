# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Tree widgets on workflow tabs."""
from lib.page.widget import tree_widget, table_with_headers
from lib.page.widget.workflow_tree_rows import (
    WorkflowCycleRow, SetupTaskGroupTreeItem)


class WorkflowCycleTreeWidget(object):
  """Represents tree widget on workflow Active Cycles / History tab."""
  # pylint: disable=too-few-public-methods

  def __init__(self, container):
    super(WorkflowCycleTreeWidget, self).__init__()
    # Composition is used here it's a tree widget with sub trees.
    # Subtrees are not implemented in `TreeWidget` class.
    self._tree_widget = tree_widget.TreeWidget(
        container=container, table_row_cls=WorkflowCycleRow)

  def workflow_cycle_rows(self):
    """Returns workflow cycle rows."""
    return self._tree_widget.tree_items()

  def get_workflow_cycle_row_by(self, **conditions):
    """Returns a workflow cycle row by conditions."""
    return table_with_headers.get_sub_row_by(
        rows=self.workflow_cycle_rows, **conditions)


class SetupTaskGroupTree(tree_widget.TreeWidget):
  """Represents tree of TaskGroups."""

  def __init__(self, container):
    super(SetupTaskGroupTree, self).__init__(
        container=container, table_row_cls=SetupTaskGroupTreeItem)
