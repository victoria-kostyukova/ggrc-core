# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""REST service for people."""
from lib.entities import app_entity
from lib.rest import base_rest_service, rest_convert


class PersonRestService(base_rest_service.ObjectRestService):
  """REST service for Person app entities."""
  _app_entity_cls = app_entity.Person

  @staticmethod
  def _map_to_rest_for_create_obj(obj):
    """See superclass."""
    return dict(
        name=obj.name,
        email=obj.email,
        context=rest_convert.default_context()
    )
