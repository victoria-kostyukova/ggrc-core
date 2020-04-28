# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""REST facade for people."""
from lib import decorator
from lib.app_entity_factory import person_entity_factory
from lib.rest_services import person_rest_service


@decorator.check_that_obj_is_created
def create_person(**attrs):
  """Creates Person via REST."""
  person = person_entity_factory.PersonFactory().create(**attrs)
  return person_rest_service.PersonRestService().create(person)


def create_person_with_role(role_name, **person_attrs):
  """Creates person with role `role_name` and Person attributes `person_attrs`
  via REST.
  """
  person = create_person(**person_attrs)
  role = person_rest_service.global_role_with_name(role_name)
  user_role = person_entity_factory.UserRoleFactory().create_empty(
      person=person, role=role)
  person_rest_service.UserRoleRestService().create(user_role)
  person.global_role_name = role_name
  return person
