# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Control tab."""
from lib.page.widget import object_page, tree_widget, controls_tree_rows


class ControlsTab(object_page.ObjectPage):
  """Controls tab."""

  @staticmethod
  def _url_fragment():
    """See superclass."""
    return "control"

  @property
  def _tree_widget(self):
    """Returns tree widget with controls."""
    return tree_widget.TreeWidget(
        container=self._browser.section(id=self._url_fragment()),
        table_row_cls=controls_tree_rows.ControlsRow)

  def rows(self):
    """Returns rows with controls."""
    return self._tree_widget.tree_items()

  def get_control(self, control):
    """Gets control."""
    return self._tree_widget.get_tree_item_by(title=control.title)

  def select_control(self, control):
    """Opens control."""
    self.get_control(control=control).select()
