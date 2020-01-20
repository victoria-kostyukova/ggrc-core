# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""REST service for people."""
from lib import decorator
from lib.app_entity import person_entity
from lib.constants import roles
from lib.rest import base_rest_service, rest_convert


class PersonRestService(base_rest_service.ObjectRestService):
  """REST service for Person app entities."""
  app_entity_cls = person_entity.Person

  @staticmethod
  def _map_to_rest_for_create_obj(obj):
    """See superclass."""
    return dict(
        name=obj.name,
        email=obj.email,
        context=rest_convert.default_context()
    )

  def _map_from_rest(self, rest_dict):
    """See superclass."""
    mapping = super(PersonRestService, self)._map_from_rest(rest_dict)
    mapping.update(
        name=rest_dict["name"],
        email=rest_dict["email"]
    )
    return mapping


class GlobalRoleRestService(base_rest_service.ObjectRestService):
  """REST service for GlobalRole app entities."""
  app_entity_cls = person_entity.GlobalRole
  _obj_name = "role"

  @staticmethod
  def _map_from_rest(rest_dict):
    """See superclass."""
    return dict(
        obj_id=rest_dict["id"],
        name=rest_dict["name"]
    )


@decorator.memoize
def all_global_roles():
  """Returns all global roles."""
  return GlobalRoleRestService().get_collection()


def global_role_with_name(name):
  """Returns a global role (GlobalRole) by name."""
  return next(role for role in all_global_roles() if role.name == name)


class UserRoleRestService(base_rest_service.ObjectRestService):
  """REST service for UserRole app entities."""
  app_entity_cls = person_entity.UserRole

  @staticmethod
  def _map_to_rest_for_create_obj(obj):
    """See superclass."""
    return dict(
        person=rest_convert.to_basic_rest_obj(obj.person),
        role=rest_convert.to_basic_rest_obj(obj.role),
        context=(rest_convert.administrator_context()
                 if obj.role.name == roles.ADMINISTRATOR
                 else rest_convert.default_context())
    )
