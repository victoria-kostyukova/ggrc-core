# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Factories for app entities in person.py."""
from lib.app_entity import person_entity
from lib.app_entity_factory import _base
from lib.utils import random_utils


class PersonFactory(_base.BaseFactory):
  """Factory for Person entities."""
  _entity_cls = person_entity.Person

  @property
  def _default_attrs(self):
    """See superclass."""
    return {
        "name": self._obj_title,
        "email": random_utils.get_email()
    }


class GlobalRoleFactory(_base.BaseFactory):
  """Factory for GlobalRole entities."""
  _entity_cls = person_entity.GlobalRole


class UserRoleFactory(_base.BaseFactory):
  """Factory for UserRole entities."""
  _entity_cls = person_entity.UserRole
