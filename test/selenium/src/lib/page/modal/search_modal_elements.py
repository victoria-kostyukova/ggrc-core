# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Elements of search / mapper modal."""
from lib.page.widget import table_with_headers


class SearchFilterArea(object):
  """Represents an upper filter area of search / mapper modal."""

  def __init__(self, container):
    self._root = container
    self._search_btn = self._root.button(text="Search")

  def search_obj(self, obj):
    """Searches for object."""
    self.select_obj_type(obj.obj_type())
    self._set_title(obj.title)
    self._click_search()
    self._wait_for_search_results()

  def select_obj_type(self, obj_type):
    """Selects object type."""
    self._root.select(name="type-select").wait_until(
        lambda e: e.exists).option(data_singular=obj_type).click()

  def _set_title(self, title):
    """Types in title into search criteria text box.
    This is a very simple implementation of attribute filtering
    that doesn't assert chosen attribute, operator,
    is not able to add other attrs, etc. and will have to be drastically
    improved when tests that use these features will be added.
    """
    filter_row = self._root.element(class_name="filter-container__attribute")
    title = self._escape_filter_string(title)
    filter_row.text_field(name="right").set(title)

  @staticmethod
  def _escape_filter_string(str_to_escape):
    """Returns an escaped string for searching.
    Some special symbols should be escaped (GGRC-3004).
    """
    backslash = "\\"
    return str_to_escape.replace(backslash, backslash + backslash)

  def _click_search(self):
    """Clicks `Search` button."""
    self._search_btn.click()

  def _wait_for_search_results(self):
    """Waits for search results to be refreshed."""
    self._search_btn.wait_until_not(lambda btn: btn.disabled)


class SearchResultsArea(object):
  """Represents a bottom search results area of search / mapper modal."""

  def __init__(self, container):
    self._root = container
    self._table = table_with_headers.TableWithHeaders(
        container=self._root,
        header_elements=self.search_result_headers,
        table_rows=self.search_result_rows
    )
    self.get_result_by = self._table.get_table_row_by

  def search_result_headers(self):
    """Returns table header elements."""
    return self._root.element(
        tag_name="mapper-results-items-header").divs(class_name="title")

  def search_result_rows(self):
    """Returns search result rows."""
    return [_SearchResultRow(row_el, self._table.table_header_names())
            for row_el in self._root.elements(class_name="object-list__item")]

  def click_map_selected(self):
    """Clicks `Map Selected` button."""
    self._root.button(text="Map Selected").click()
    self._root.wait_until(lambda modal: not modal.exists)


class _SearchResultRow(object):
  """Represents a search result item in object mapper."""

  def __init__(self, container, table_header_names):
    self._root = container
    self._table_row = table_with_headers.TableRow(
        container=container,
        table_header_names=table_header_names,
        cell_locator={"class_name": "attr"}
    )

  def matches_conditions(self, **conditions):
    """Returns whether a row matches conditions."""
    return self._table_row.matches_conditions(self, **conditions)

  def select(self):
    """Selects search result for mapping."""
    self._root.element(
        tag_name="object-selection-item").checkbox().set()
