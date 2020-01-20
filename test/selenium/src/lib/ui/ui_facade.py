# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""General UI facade."""
# pylint: disable=invalid-name
from lib import users
from lib.entities import entity_operations
from lib.page.widget import object_page
from lib.ui import internal_ui_operations
from lib.utils import selenium_utils


def open_obj(obj):
  """Opens the url of obj."""
  selenium_utils.open_url(entity_operations.obj_url(obj))


def get_obj(obj):
  """Opens the url of `app_obj`, builds the object from the page and
  returns it.
  """
  open_obj(obj)
  return internal_ui_operations.build_obj(obj)


def edit_obj(obj, **changes):
  """Updates object."""
  open_obj(obj)
  internal_ui_operations.info_widget_page(obj).edit_obj(**changes)
  obj.modified_by = users.current_person()


def delete_obj(obj):
  """Deletes object."""
  open_obj(obj)
  internal_ui_operations.info_widget_page(obj).delete_obj()


def active_tab_name():
  """Returns a tab name of the active tab."""
  return object_page.ObjectPage().top_tabs.active_tab.name
