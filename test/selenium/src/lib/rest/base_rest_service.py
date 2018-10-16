# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""REST service for entities."""
from lib.rest import api_client


def create_obj(obj, **mapping):
  """Creates obj `obj` via REST.
  This method modifies the argument object rather than creating a new object
  as argument object is an "expected" object.
  """
  result_obj_dict = send_create_obj_request(obj, mapping)
  obj.obj_id = result_obj_dict["id"]
  if hasattr(obj, "code") and not obj.code:
    obj.code = result_obj_dict["slug"]
  obj.rest_context = result_obj_dict["context"]
  return obj


def send_create_obj_request(obj, rest_obj_dict):
  """Creates obj `rest_obj."""
  url = _create_obj_api_url(obj)
  obj_name = obj.obj_name()
  json_body = [{obj_name: rest_obj_dict}]
  response = api_client.send_post(url, json_body)
  assert response[0][0] == 201
  return response[0][1][obj_name]


def _create_obj_api_url(obj):
  """Returns API url for object creation."""
  return _api_url(obj.plural_obj_name())


def get_obj_collection(collection_name):
  """Returns a requested collection."""
  response = api_client.send_get(_api_url(collection_name))
  return response["{}_collection".format(collection_name)][collection_name]


def _api_url(url):
  """Appends `/api` to the url."""
  return "api/{}".format(url)
