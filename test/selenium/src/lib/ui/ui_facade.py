# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""General UI facade."""
from lib.entities import entity_operations
from lib.page.widget import object_page
from lib.ui import internal_ui_operations
from lib.utils import selenium_utils


def get_obj(app_obj):
  """Opens the url of `app_obj`, builds the object from the page and
  returns it.
  """
  selenium_utils.open_url(entity_operations.obj_url(app_obj))
  return internal_ui_operations.build_obj(app_obj)


def active_tab_name():
  """Returns a tab name of the active tab."""
  return object_page.ObjectPage().top_tabs.active_tab.name
