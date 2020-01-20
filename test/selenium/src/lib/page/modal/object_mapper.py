# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Object mapper modal."""
from lib import base
from lib.page.modal import search_modal_elements


class ObjectMapper(base.WithBrowser):
  """Object mapper modal."""
  # pylint: disable=too-few-public-methods

  def __init__(self):
    super(ObjectMapper, self).__init__()
    self._root = self._browser.element(tag_name="object-mapper")

  @property
  def search_filter_area(self):
    return search_modal_elements.SearchFilterArea(self._root)

  @property
  def search_results_area(self):
    return search_modal_elements.SearchResultsArea(self._root)

  @property
  def map_selected_btn(self):
    return self._root.button(text="Map Selected")

  def click_map_selected(self):
    """Clicks `Map Selected` button."""
    self.map_selected_btn.click()
    self._root.wait_until(lambda modal: not modal.exists)

  def map_obj(self, obj):
    """Maps object."""
    self.search_filter_area.search_obj(obj)
    self.search_results_area.get_result_by(title=obj.title).select()
    self.click_map_selected()
