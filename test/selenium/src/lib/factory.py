# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"Factory for modules, classes, methods, functions."

from lib import cache, constants, exception
from lib.constants import objects, element
from lib.element import tree_view, tree_view_item, info_widget_three_bbs


def _filter_out_underscore(object_name):
  """Since class names don't allow underscore in names, we're parsing them
 out"""
  return object_name if "_" not in object_name \
      else object_name.replace("_", "")


def _all_subclasses(cls):
  """Return all subclassses for parent"""
  return cls.__subclasses__() + \
      [g for s in cls.__subclasses__() for g in _all_subclasses(s)]


def _factory(cls_name, parent_cls, search_nested_subclasses=False):
  """Return subclass from parent
 Args:
    cls_name (basestring)
    parent_cls (cls)
    search_nested_subclasses (bool)
 Return:
    cls
 """
  member_cls = None
  subcls_name = _filter_out_underscore(cls_name.lower())
  members = (_all_subclasses(parent_cls) if search_nested_subclasses else
             parent_cls.__subclasses__())
  for member_cls in members:
    if member_cls.__name__.lower() == subcls_name:
      break
  else:
    raise exception.NoClassFound(
        "%s for parent %s" % (subcls_name, parent_cls))
  return member_cls


def get_method_lhn_select(object_name):
  """Return method of LHN class
 Args:
    object_name (basestring)
 """
  return (constants.method.SELECT_PREFIX +
          cache.LHN_SECTION_MEMBERS[object_name])


def get_method_select(object_name):
  """Return method of LHN class
 Args:
    object_name (basestring)
 """
  return constants.method.SELECT_PREFIX + object_name


def get_fields_to_set(object_name):
  """Get and return of constant DEFAULT_SET_FIELDS (tuple of default visible
  fields to setup) from lib.constants.element module.
  """
  cls_name = objects.get_singular(object_name) + "ModalSetVisibleFields"
  base_cls = element.CommonModalSetVisibleFields
  set_fields_modal_cls = _factory(cls_name=cls_name, parent_cls=base_cls,
                                  search_nested_subclasses=True)
  return set_fields_modal_cls().DEFAULT_SET_FIELDS


def get_cls_widget(object_name, is_info=False, is_admin=False):
  """Get and return class of widget. If is_info is True then class
  info_widget.'obj_name', if is_admin is True then class
  admin_widget.'tab_element', else class generic_widget.'obj_name'.
  """
  from lib.page import dashboard
  from lib.page.widget import generic_widget, info_widget
  if is_info:
    base_cls = info_widget.ReadOnlyInfoWidget
  elif is_admin:
    base_cls = dashboard.AdminDashboard
  else:
    base_cls = generic_widget.Widget
  return _factory(cls_name=object_name, parent_cls=base_cls,
                  search_nested_subclasses=True)


def get_cls_entity_factory(object_name):
  """Get and return class of entity factory."""
  from lib.entities import entities_factory
  cls_name = object_name + constants.cls_name.FACTORY
  base_cls = entities_factory.EntitiesFactory
  return _factory(cls_name=cls_name, parent_cls=base_cls,
                  search_nested_subclasses=True)


def get_cls_obj_entity(object_name):
  """Get and return class of object factory."""
  from lib.entities import entity
  cls_name = (
      objects.get_singular(object_name, title=True) +
      constants.cls_name.ENTITY)
  base_cls = entity.Representation
  return _factory(cls_name=cls_name, parent_cls=base_cls,
                  search_nested_subclasses=True)


def get_cls_rest_service(object_name):
  """Get and return class of rest service."""
  from lib.service import rest_service
  cls_name = object_name.title() + constants.cls_name.SERVICE
  base_cls = rest_service.BaseRestService
  return _factory(cls_name=cls_name, parent_cls=base_cls)


def get_cls_webui_service(object_name):
  """Get and return class of webui service."""
  from lib.service import webui_service
  cls_name = object_name + constants.cls_name.SERVICE
  base_cls = webui_service.BaseWebUiService
  return _factory(cls_name=cls_name, parent_cls=base_cls,
                  search_nested_subclasses=True)


def get_cls_3bbs_dropdown_settings(object_name):
  """Get and return class of 3BBS dropdown settings for Tree View."""
  base_cls = tree_view.CommonDropdownSettings
  return _factory(cls_name=object_name, parent_cls=base_cls)


def get_cls_3bbs_dropdown_info(object_name):
  """Get and return class of 3BBS dropdown settings for Info widget."""
  base_cls = info_widget_three_bbs.InfoWidgetThreeBbbs
  class_name = object_name + base_cls.__name__
  return _factory(cls_name=class_name, parent_cls=base_cls)


def get_cls_dropdown_tree_view_item(object_name):
  """Get and return class of TreeViewItem Dropdown object according to
  snapshotability
  """
  base_cls = tree_view_item.CommonDropdownTreeViewItem
  if object_name in objects.ALL_SNAPSHOTABLE_OBJS:
    base_cls = tree_view_item.SnapshotsDropdownTreeViewItem
  return _factory(cls_name=object_name, parent_cls=base_cls)


def get_locator_widget(widget_name):
  """Return locator for widget tab in widget bar"""
  # todo: unittests
  return getattr(constants.locator.WidgetBar, widget_name.upper())


def get_locator_add_widget(widget_name):
  """Return locator for selected widget from add widget button
 dropdown in widget bar"""
  # todo: unittests
  return getattr(
      constants.locator.WidgetBarButtonAddDropdown, widget_name.upper())
