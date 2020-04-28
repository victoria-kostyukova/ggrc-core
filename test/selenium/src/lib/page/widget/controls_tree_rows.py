# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Control tree rows."""
from lib.page.widget import tree_widget


class ControlsRow(tree_widget.TreeItem):
  """Represents workflow cycle row on workflow Active Cycles / History tab."""

  def __init__(self, row_el, table_header_names):
    super(ControlsRow, self).__init__(row_el, table_header_names)
    self._table_header_names = table_header_names
