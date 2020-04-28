# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Module of classes inherited from AbstractTabContainer control (obsolete)."""

from lib import base
from lib.constants import locator, value_aliases
from lib.utils import selenium_utils


class DashboardWidget(base.AbstractTabContainer):
  """Class of 'Dashboard' widget which contains one or few tabs."""

  def _tabs(self):
    """If dashboard controller exists set 'tab' items to actual tabs.
    Else set 'tab' items to only one active item.
      - Return: dict of tab members
    """
    if selenium_utils.is_element_exist(self._driver,
                                       self._locators.TAB_CONTROLLER_CSS):
      tabs = {tab_el.text: self.active_tab_elem
              for tab_el in self.tab_controller.get_items()}
    else:
      tabs = {value_aliases.DEFAULT: self.active_tab_elem}
    return tabs

  def _get_locators(self):
    """Return locators of DashboardContainer."""
    return locator.DashboardWidget

  def get_all_tab_names_and_urls(self):
    """Return source urls of all Dashboard members."""
    all_tabs_urls = {}
    for tab_name, tab_el in self._tabs().iteritems():
      if tab_name != value_aliases.DEFAULT:
        self.tab_controller.active_tab = tab_name
      all_tabs_urls[tab_name] = tab_el.get_property("src")
    return all_tabs_urls
