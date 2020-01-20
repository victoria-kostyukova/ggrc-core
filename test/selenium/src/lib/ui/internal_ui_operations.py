# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Workflow UI facade."""
from lib import factory, users
from lib.entities import entity_operations, ui_dict_convert
from lib.page.widget import object_page, object_modal


def submit_obj(obj):
  """Submits obj. Sets object id, code and modified_by after that."""
  obj_name = obj.obj_name()
  object_modal.get_modal_obj(obj_name).submit_obj(obj)
  obj.obj_id = object_page.ObjectPage().get_obj_id()
  if not obj.code:
    obj.code = entity_operations.obj_code(
        object_type=obj_name, obj_id=obj.obj_id)
  obj.modified_by = users.current_person()


def build_obj(app_obj):
  """Builds the object from the page and returns it."""
  obj_dict = info_widget_page(app_obj).obj_scope()
  return ui_dict_convert.ui_to_app(app_obj.obj_name(), obj_dict)


def info_widget_page(obj):
  """Returns a corresponding page object from info_widget module."""
  return factory.get_cls_widget(object_name=obj.obj_name(), is_info=True)()
