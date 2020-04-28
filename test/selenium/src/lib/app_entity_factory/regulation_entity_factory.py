# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Factories for app entities in control.py."""
from lib.app_entity import regulation_entity
from lib.app_entity_factory import _base


class RegulationFactory(_base.BaseFactory):
  """Factory for Control entities."""
  _entity_cls = regulation_entity.Regulation

  @property
  def _empty_attrs(self):
    """See superclass."""
    return {
        "title": []
    }

  @property
  def _default_attrs(self):
    """See superclass."""
    return {
        "title": self._obj_title
    }
