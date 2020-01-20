# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""REST facade for controls."""
from lib import decorator
from lib.app_entity_factory import control_entity_factory
from lib.rest_services import control_rest_service


@decorator.check_that_obj_is_created
def create_control(**attrs):
  """Creates Control via REST."""
  control = control_entity_factory.ControlFactory().create(**attrs)
  return control_rest_service.ControlRestService().create(control)
