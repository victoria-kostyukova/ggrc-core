# Copyright (C) 2019 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Simple api client to simulate external app requests"""

import json
from email.utils import parseaddr
from flask import g
from ggrc import settings
from ggrc.app import app


class ExternalApiClient(object):
  """Simulates requests from external_app"""

  API_NAMES_REVERSE_MAPPING = {
      "external_custom_attribute_definition": "custom_attribute_definition",
  }

  DEFAULT_HEADERS = {
      "X-Requested-By": "SYNC_SERVICE",
      "Content-Type": "application/json",
      "X-URLFetch-Service-Id": "GOOGLEPLEX",
      "X-Appengine-Inbound-Appid": settings.ALLOWED_QUERYAPI_APP_IDS
  }

  def __init__(self, user_headers=None, use_ggrcq_service_account=False):
    self.client = app.test_client()
    self.user_headers = user_headers or {}
    self._use_ggrcq_service_account = use_ggrcq_service_account
    self.ggrc_user_email = self._extract_service_account_email()

  def _extract_service_account_email(self):
    """Extract email from settings based (sync_service to ext_app)"""
    service_account = (
        settings.SYNC_SERVICE_USER
        if not self._use_ggrcq_service_account else settings.EXTERNAL_APP_USER
    )
    _, email = parseaddr(service_account)
    return email

  def _build_service_account_header(self):
    return {"X-ggrc-user": json.dumps({"email": self.ggrc_user_email})}

  def _build_headers(self):
    """Builds ext_app specific headers"""
    headers = self.DEFAULT_HEADERS.copy()
    headers.update(self._build_service_account_header())
    headers.update(self.user_headers)
    return headers

  def get(self, obj=None, obj_id=None, url=None):
    """Simulates ext_app GET request"""
    if not url:
      obj_type = self._get_object_type(obj)
      url = self._build_api_link(obj_type, obj_id)
    headers = self._build_headers()
    return self.client.get(url, headers=headers)

  @staticmethod
  def _get_object_type(obj):
    """Determinate object type for given object"""
    if isinstance(obj, basestring):
      obj_type = obj
    elif hasattr(obj, "_inflector"):
      obj_type = obj._inflector.table_singular
    else:
      raise ValueError("Unknown object type: {}".format(type(obj)))
    return obj_type

  def post(self, obj=None, url=None, data=None):
    """Simulates ext_app POST request"""
    if not url:
      obj_type = self._get_object_type(obj)
      url = self._build_api_link(obj_type)
    headers = self._build_headers()
    assert isinstance(data, (dict, list)), "'data' must be in dict or list"
    return self.client.post(url, data=json.dumps(data), headers=headers)

  def put(self, obj=None, obj_id=None, data=None):
    """Simulates ext_app PUT request

    Default behavior is not use precondition headers:
     - "If-Match"
     - "If-Unmodified-Since"
    same as sync service does.
    """

    obj_type = self._get_object_type(obj)
    assert obj_id, "obj_id is mandatory for PUT request"
    assert data, "data is mandatory for PUT request"
    url = self._build_api_link(obj_type, obj_id)
    headers = self._build_headers()

    resp = self.get(obj_type, obj_id)
    g.user_cache = {}
    # precondition_headers used to simulate requests from ggrcq
    # (not from sync service)
    if self._use_ggrcq_service_account:
      precondition_headers = {
          "If-Match": resp.headers.get("Etag"),
          "If-Unmodified-Since": resp.headers.get("Last-Modified")
      }
      headers.update(precondition_headers)

    obj_type = self.API_NAMES_REVERSE_MAPPING.get(obj_type, obj_type)
    if obj_type not in data:
      resp.json[obj_type].update(data)
      data = resp.json

    return self.client.put(url, data=json.dumps(data), headers=headers)

  def _get_precondition_headers(self, obj_type, obj_id):
    """To perform DELETE/PUT client needs specific headers

    To build such headers we need to issue GET request.
    """
    resp = self.get(obj_type, obj_id)
    precondition_headers = {
        "If-Match": resp.headers.get("Etag"),
        "If-Unmodified-Since": resp.headers.get("Last-Modified")
    }
    return precondition_headers

  @staticmethod
  def _build_api_link(obj_type, obj_id=None):
    """Build api link based on obj_type and obj_id"""
    obj_id_part = "" if obj_id is None else "/" + str(obj_id)
    return "/api/{}s{}".format(obj_type, obj_id_part)

  def delete(self, obj, obj_id, url=None):
    """Simulates ext_app DELETE request"""
    assert self._use_ggrcq_service_account,\
        "sync service is not use delete request"

    obj_type = self._get_object_type(obj)
    if not url:
      url = self._build_api_link(obj_type, obj_id)

    headers = self._build_headers()
    precondition_headers = self._get_precondition_headers(obj_type, obj_id)
    g.user_cache = {}

    headers.update(precondition_headers)
    return self.client.delete(url, headers=headers)

  def unmap(self, obj1, obj2):
    """Sync service uses special endpoint to delete relationships"""

    assert not self._use_ggrcq_service_account,\
        "external app is not use unmap endpoint use 'delete' instead"

    data = {
        "first_object_id": obj1.id,
        "first_object_type": obj1.type,
        "second_object_id": obj2.id,
        "second_object_type": obj2.type,
    }
    return self.post(url="/api/relationships/unmap", data=data)
