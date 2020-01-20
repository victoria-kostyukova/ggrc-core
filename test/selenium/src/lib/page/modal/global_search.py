# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Global search modal."""
from lib import base
from lib.page.modal import search_modal_elements


class GlobalSearch(base.WithBrowser):
  """Global search modal."""
  # pylint: disable=too-few-public-methods

  def __init__(self):
    super(GlobalSearch, self).__init__()
    self._root = self._browser.element(tag_name="object-search")

  @property
  def search_results_area(self):
    return search_modal_elements.SearchResultsArea(self._root)

  @property
  def search_filter_area(self):
    return search_modal_elements.SearchFilterArea(self._root)

  @property
  def saved_searches_area(self):
    return search_modal_elements.SavedSearchesArea(self._root)

  def search_obj(self, obj):
    """Search object via Global Search.
    Returns found object item."""
    self.search_filter_area.search_obj(obj)
    return self.search_results_area.get_result_by(title=obj.title)

  def create_and_save_search(self, obj):
    """Creates and saves a search via Global Search.
    Waits until a new search is present in Saved Searches."""
    search_title = "search_for_{}".format(obj.title)
    self.search_filter_area.set_search_attributes(obj)
    self.search_filter_area.save_search(search_title)
    self.saved_searches_area.get_search_by_title(
        search_title).wait_until(lambda search: search.present)
    return search_title
