# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""REST service for Control app entities."""
from lib import decorator
from lib.entities import app_entity
from lib.rest import base_rest_service, rest_convert


class ControlRestService(base_rest_service.ObjectRestService):
  """REST service for Control app entities."""
  _app_entity_cls = app_entity.Control

  @staticmethod
  def _map_to_rest_for_create_obj(obj):
    """See superclass."""
    return dict(
        title=obj.title,
        access_control_list=rest_convert.build_access_control_list(obj),
        assertions=[rest_convert.to_basic_rest_obj(assertion)
                    for assertion in obj.assertions],
        context=rest_convert.default_context()
    )


class ControlAssertionRestService(base_rest_service.ObjectRestService):
  """REST service for ControlAssertion app entities."""
  _app_entity_cls = app_entity.ControlAssertion

  @staticmethod
  def _map_from_rest(rest_dict):
    """See superclass."""
    return dict(
        obj_id=rest_dict["id"],
        name=rest_dict["name"]
    )


@decorator.memoize
def all_control_assertions():
  """Returns all control assertions."""
  return ControlAssertionRestService().get_collection()


def assertion_with_name(name):
  """Returns a control assertion by name."""
  return next(assertion for assertion in all_control_assertions()
              if assertion.name == name)
