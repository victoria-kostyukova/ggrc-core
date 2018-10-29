# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""REST facade for controls."""
from lib.entities import app_entity_factory
from lib.rest_services import control_rest_service


def create_control(**attrs):
  """Creates Control via REST."""
  control = app_entity_factory.ControlFactory().create(**attrs)
  return control_rest_service.ControlRestService().create(control)
