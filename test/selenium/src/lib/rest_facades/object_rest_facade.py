# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""REST facade for objects."""
from lib.rest import base_rest_service


def get_obj(obj):
  """Sends request to get the object."""
  return base_rest_service.get_service_by_entity_cls(type(obj)).get(obj)


def set_attrs_via_get(obj, attr_names):
  """Sets attrs `attrs` for `obj` by sending a GET request."""
  retrieved_obj = get_obj(obj)
  for attr_name in attr_names:
    retrieved_attr_value = getattr(retrieved_obj, attr_name)
    setattr(obj, attr_name, retrieved_attr_value)
