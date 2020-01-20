# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Base REST services."""
from lib.app_entity_factory import (
    person_entity_factory, entity_factory_common)
from lib.constants import objects
from lib.rest import api_client
from lib.utils import date_utils


def get_service_by_entity_cls(entity_cls):
  """Returns rest service by `app_entity` class."""
  return next(service_cls for service_cls in ObjectRestService.__subclasses__()
              if service_cls.app_entity_cls == entity_cls)()


class ObjectRestService(object):
  """Base REST service for manipulating `app_entity` objects."""

  @property
  def app_entity_cls(self):
    """Returns an `app_entity` class that this service is expected to handle.
    Should be overridden in subclass.
    """
    raise NotImplementedError

  @property
  def _obj_name(self):
    """Returns object name. May be overridden in subclass."""
    return self.app_entity_cls.obj_name()

  @staticmethod
  def _map_to_rest_for_create_obj(obj):
    """Returns a mapping from `app_entity` attributes to dict for
    Create obj (POST) request.
    May be overridden in subclass.
    """
    # pylint: disable=unused-argument
    return {}

  def _map_to_rest_for_edit_obj(self, obj):
    """Returns a mapping from `app_entity` attributes to dict for
    Edit obj (PUT) request.
    May be overridden in subclass.
    """
    mapping = self._map_to_rest_for_create_obj(obj)
    mapping.update(self._map_to_rest_specific_for_edit_obj(obj))
    return mapping

  @staticmethod
  def _map_to_rest_specific_for_edit_obj(obj):
    """Returns a part of mapping from `app_entity` attributes to dict for
    Edit obj request, specific for Edit obj request.
    May be overridden in subclass.
    """
    # pylint: disable=invalid-name
    return {"id": obj.obj_id}

  @staticmethod
  def _map_from_rest(rest_dict):
    """Returns mapping from REST response's dict to `app_entity` attributes.
    May be overridden in subclass.
    """
    # pylint: disable=unused-argument
    return {
        "obj_id": rest_dict["id"],
        "rest_context": rest_dict["context"],
        "created_at": date_utils.iso8601_to_datetime(rest_dict["created_at"]),
        "updated_at": date_utils.iso8601_to_datetime(rest_dict["updated_at"])
    }

  def create(self, obj):
    """Sends request to create an object."""
    url = self._api_url(self._plural_obj_name)
    json_body = [{self._obj_name: self._map_to_rest_for_create_obj(obj)}]
    response_elems = api_client.send_post(url, json_body).json()
    assert len(response_elems) == 1  # one object is created
    response_obj_dict = self._get_obj_dict_from_post_response_elem(
        response_elems[0])
    self._set_attrs_from_response(obj, response_obj_dict)
    return obj

  def _get_obj_dict_from_post_response_elem(self, response_elem):
    """Gets obj dict from part of response to Create object(s) request."""
    # pylint: disable=invalid-name
    assert response_elem[0] == 201
    return response_elem[1][self._obj_name]

  def get(self, obj):
    """Sends request to get the object."""
    url = self._api_url(self._plural_obj_name + "/" + str(obj.obj_id))
    response = api_client.send_get(url)
    rest_dict = response.json()
    assert self._obj_name in rest_dict
    self._set_headers_from_response(obj, response)
    return self._create_obj_from_rest_dict(rest_dict[self._obj_name])

  def edit(self, obj):
    """Sends request to edit the object."""
    if not obj.rest_headers_for_update:
      self.get(obj)  # to set If-Match and If-Unmodified-Since headers
    url = self._api_url(self._plural_obj_name + "/" + str(obj.obj_id))
    json_body = {self._obj_name: self._map_to_rest_for_edit_obj(obj)}
    response = api_client.send_put(
        url, json_body, headers=obj.rest_headers_for_update)
    assert self._obj_name in response.json()
    self._set_headers_from_response(obj, response)

  def get_collection(self):
    """Gets a collection."""
    response = api_client.send_get(self._api_url(self._plural_obj_name)).json()
    rest_dicts = response["{}_collection".format(
        self._plural_obj_name)][self._plural_obj_name]
    entity_objs = []
    for rest_dict in rest_dicts:
      entity_obj = self._create_obj_from_rest_dict(rest_dict)
      entity_objs.append(entity_obj)
    return entity_objs

  @staticmethod
  def _set_attrs_from_response(obj, result_dict):
    """Sets `obj`'s attributes generated on back-end."""
    obj.obj_id = result_dict["id"]
    obj.created_at = date_utils.iso8601_to_datetime(result_dict["created_at"])
    obj.updated_at = date_utils.iso8601_to_datetime(result_dict["updated_at"])
    obj.modified_by = person_entity_factory.PersonFactory().create_empty(
        obj_id=result_dict["modified_by"]["id"])
    if hasattr(obj, "code") and not obj.code:
      obj.code = result_dict["slug"]
    obj.rest_context = result_dict["context"]

  @staticmethod
  def _set_headers_from_response(obj, response):
    """Sets `If-Match` and `If-Unmodified-Since` headers.
    These headers are required for PUT and DELETE requests.
    If-Match is calculated based on `updated_at`.
    If-Unmodified-Since corresponds to `updated_at`.
    """
    obj.rest_headers_for_update = {}
    obj.rest_headers_for_update["If-Match"] = response.headers["Etag"]
    obj.rest_headers_for_update["If-Unmodified-Since"] = response.headers[
        "Last-Modified"]

  @property
  def _plural_obj_name(self):
    """Returns plural obj name."""
    return objects.get_plural(self._obj_name)

  def _create_obj_from_rest_dict(self, rest_dict):
    """Create an `app_entity` object from response dict."""
    return entity_factory_common.get_factory_by_entity_cls(
        self.app_entity_cls).create_empty(**self._map_from_rest(rest_dict))

  @staticmethod
  def _api_url(url):
    """Prepends `api/` to the url."""
    return "api/{}".format(url)
