# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Tree view."""
import inflection

from lib.page.widget import table_with_headers
from lib.utils import test_utils


class TreeWidget(object):
  """Tree widget."""

  def __init__(self, container, table_row_cls=None):
    super(TreeWidget, self).__init__()
    self._root = container
    self._table_row_cls = table_row_cls if table_row_cls else TreeItem
    self._table = table_with_headers.TableWithHeaders(
        self._root,
        header_elements=self._tree_header_elements,
        table_rows=self.tree_items
    )

  def _tree_header_elements(self):
    """Returns tree header elements."""
    return self._root.elements(class_name="tree-header-titles__text")

  def get_tree_item_by(self, **conditions):
    """Returns a table row that matches conditions."""
    return self._table.get_table_row_by(**conditions)

  def tree_items(self):
    """Returns tree items."""
    self._wait_loading()
    return [self._table_row_cls(row, self._table.table_header_names())
            for row in self._tree_item_rows()]

  def _tree_item_rows(self):
    """Returns tree item elements."""
    return self._root.elements(class_name="tree-item-content")

  def _wait_loading(self):
    """Wait for elements to load."""
    def results_present():
      """Return if results are present."""
      if self._root.element(class_name="tree-no-results-message").present:
        return True
      if list(self._tree_item_rows()):
        return True
      return False
    test_utils.wait_for(results_present)


class TreeItem(object):
  """Tree item."""

  def __init__(self, row_el, table_header_names):
    self._root = row_el
    self._table_header_names = table_header_names
    self._table_row = table_with_headers.TableRow(
        container=row_el,
        table_header_names=table_header_names,
        cell_locator={"class_name": "attr-content"}
    )
    self.text_for_header = self._table_row.text_for_header

  def matches_conditions(self, **conditions):
    """Returns whether a row matches conditions."""
    return self._table_row.matches_conditions(self, **conditions)

  def obj_dict(self):
    """Returns an obj dict."""
    dict_keys = [inflection.underscore(header_name.replace(" ", ""))
                 for header_name in self._table_header_names]
    return self.obj_dict_from_keys(dict_keys)

  def obj_dict_from_keys(self, dict_keys):
    """Returns an obj dict based on the list of keys."""
    return self._table_row.obj_dict(self, dict_keys=dict_keys)

  def select(self):
    """Clicks tree item to open info panel."""
    self._root.element(class_name="selectable-attrs").click()

  def hover(self):
    """Hovers over tree item."""
    self._root.element(class_name="selectable-attrs").hover()

  def hover_actions_gear(self):
    """Hovers over gear actions for tree item."""
    self.hover()
    self._root.element(tag_name="tree-item-actions").hover()

  def select_map_to_this_object(self):
    """Select map to this object from gear."""
    self.hover_actions_gear()
    self._root.link(data_toggle="unified-mapper").click()

  @property
  def is_expanded(self):
    """Returns whether the row is expanded."""
    actions_el = self._root.element(tag_name="tree-item-actions")
    js_script = "return $(arguments[0]).viewModel().expanded"
    return actions_el.execute_script(js_script, actions_el) is True

  @property
  def is_editable(self):
    """Returns whether tree item can be edited."""
    return self._root.element(text="Edit object").exists
