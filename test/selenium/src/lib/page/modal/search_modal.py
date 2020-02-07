# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Search modals."""
from lib import base
from lib.page.modal import search_modal_elements
from lib.utils import selenium_utils


class BaseSearch(base.WithBrowser):
  """Base search modal."""
  # pylint: disable=too-few-public-methods

  def __init__(self):
    super(BaseSearch, self).__init__()
    self._root = self._browser.element(tag_name="object-search")

  @property
  def search_filter_area(self):
    """Returns a search filter area."""
    return search_modal_elements.SearchFilterArea(self._root)

  @property
  def saved_searches_area(self):
    """Returns a saved searches area."""
    return search_modal_elements.SavedSearchesArea(self._root)

  @property
  def saved_searches_titles(self):
    """Returns list of titles of saved searches."""
    return [search.title for search in self.saved_searches_area.saved_searches]

  def create_and_save_searches(self, objs):
    """Creates searches for each obj.
    Returns list of searches titles."""
    return [self.create_and_save_search(obj) for obj in objs]

  def create_and_save_search(self, obj):
    """Creates and saves a search. Waits until a new search is
    present in Saved Searches."""
    search_title = "search_for_{}".format(obj.title)
    self.search_filter_area.set_search_attributes(obj)
    self.search_filter_area.save_search(search_title)
    self.saved_searches_area.get_search_by_title(
        search_title).wait_until_present()
    return search_title

  def remove_saved_search(self, search_title):
    """Removes saved search by its title. Waits for java script."""
    self.saved_searches_area.get_search_by_title(
        search_title).click_remove()
    selenium_utils.wait_for_js_to_load(self._driver)


class GlobalSearch(BaseSearch):
  """Global search modal."""

  @property
  def search_results_area(self):
    """Returns a search results area."""
    return search_modal_elements.SearchResultsArea(self._root)

  def search_obj(self, obj):
    """Search object via Global Search.
    Returns found object item."""
    self.search_filter_area.search_obj(obj)
    return self.search_results_area.get_result_by(title=obj.title)


class AdvancedSearch(BaseSearch):
  """Advanced search modal."""

  def __init__(self):
    super(AdvancedSearch, self).__init__()
    self._root = self._browser.element(class_name="advanced-search__modal")

  @property
  def search_filter_area(self):
    """Returns a search filter area."""
    return search_modal_elements.AdvancedSearchFilterArea(self._root)
