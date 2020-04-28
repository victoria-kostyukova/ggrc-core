# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Factories for app entities in common.py."""
from lib.app_entity import comment_entity
from lib.app_entity_factory import _base, control_entity_factory


def get_factory_by_obj_name(obj_name):
  """Returns a factory class by object name."""
  return {
      "control": control_entity_factory.ControlFactory
  }[obj_name]


def get_factory_by_entity_cls(entity_cls):
  """Returns an object of factory class by entity class."""
  # pylint: disable=protected-access
  return next(factory_cls for factory_cls in _base.BaseFactory.__subclasses__()
              if factory_cls._entity_cls == entity_cls)()


class CommentFactory(_base.BaseFactory):
  """Factory for Comment entities."""
  _entity_cls = comment_entity.Comment
