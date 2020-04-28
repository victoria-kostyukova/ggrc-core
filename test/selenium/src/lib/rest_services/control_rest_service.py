# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""REST service for Control app entities."""
from lib.app_entity import control_entity
from lib.rest import base_rest_service, rest_convert


class ControlRestService(base_rest_service.ObjectRestService):
  """REST service for Control app entities."""
  app_entity_cls = control_entity.Control

  @staticmethod
  def _map_to_rest_for_create_obj(obj):
    """See superclass."""
    return dict(
        title=obj.title,
        access_control_list=rest_convert.build_access_control_list(obj),
        assertions=[assertion for assertion in obj.assertions],
        context=rest_convert.default_context(),
        review_status=obj.review_status,
        review_status_display_name=obj.review_status_display_name,
        external_id=obj.external_id,
        external_slug=obj.external_slug,
    )


class ControlAssertionRestService(base_rest_service.ObjectRestService):
  """REST service for ControlAssertion app entities."""

  @staticmethod
  def _map_from_rest(rest_dict):
    """See superclass."""
    return dict(
        obj_id=rest_dict["id"],
        name=rest_dict["name"]
    )


def assertion_with_name(name):
  """Returns a control assertion by name."""
  all_control_assertions = ["Confidentiality", "Integrity", "Availability",
                            "Security", "Privacy"]
  return next(assertion for assertion in all_control_assertions
              if assertion == name.title())
