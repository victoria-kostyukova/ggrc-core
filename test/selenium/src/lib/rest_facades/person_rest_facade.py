# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""REST facade for people."""
from lib.entities import app_entity_factory
from lib.rest_services import person_rest_service


def create_person(**attrs):
  """Creates Person via REST."""
  person = app_entity_factory.PersonFactory().create(**attrs)
  return person_rest_service.PersonRestService().create(person)
