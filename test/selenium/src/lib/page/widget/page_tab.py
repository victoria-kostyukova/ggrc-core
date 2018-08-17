# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Operations with page tabs"""

from lib import base


class WithPageTab(base.WithBrowser):
  """Mixin for page tab"""
  # pylint: disable=too-few-public-methods

  def ensure_tab(self, tab_name):
    """Ensure that page tab `tab_name` is opened"""
    tabs_el = self._browser.element(class_name="nav-tabs")
    opened_tab_name = tabs_el.li(class_name="active").text
    if opened_tab_name != tab_name:
      tabs_el.li(text=tab_name).click()
