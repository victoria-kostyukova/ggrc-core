# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Operations with page tabs"""


class Tabs(object):
  """Represents a container with tab elements."""
  # pylint: disable=inconsistent-return-statements

  TOP = "top"
  INTERNAL = "internal"

  def __init__(self, container, level):
    if level == self.TOP:
      # 'if' statement is needed for getting only elements of displayed tabs
      self.tab_elements = [el.element() for el in container.elements(
          tag_name="inner-nav-item") if el.element().exists]
    elif level == self.INTERNAL:
      self.tab_elements = [el.parent() for el in container.elements(
          class_name="nav-tabs__panel")]
    else:
      raise NotImplementedError

  @property
  def tabs(self):
    """Returns a list of tabs."""
    return [Tab(tab_el) for tab_el in self.tab_elements]

  @property
  def tab_names(self):
    """Returns a list of tab names."""
    return [tab.name for tab in self.tabs]

  @property
  def active_tab(self):
    """Returns active tab."""
    return Tab(self._active_tab_el())

  def ensure_tab(self, tab_name):
    """Ensure that page tab `tab_name` is opened."""
    if self.active_tab.name != tab_name:
      self._tab_with_name(tab_name).select()

  def _tab_with_name(self, name):
    """Returns tab with name `name`."""
    for tab in self.tabs:
      if tab.name == name:
        return tab

  def _active_tab_el(self):
    """Returns an active tab element."""
    for tab_el in self.tab_elements:
      if "active" in tab_el.classes:
        return tab_el


class Tab(object):
  """Represents a single tab element."""

  def __init__(self, tab_el):
    self._root = tab_el

  @property
  def name(self):
    """Returns name of the tab."""
    return self._root.text

  def select(self):
    """Selects tab."""
    self._root.click()

  @property
  def tab_icon(self):
    """Return tab icon"""
    return self._root.element(class_name='fa')
