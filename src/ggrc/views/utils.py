# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Helpers for views"""

from functools import wraps
from werkzeug import exceptions

from flask import request

from ggrc.login import is_external_app_user


class DocumentEndpoint(object):
  """Container for document related endpoint"""

  @staticmethod
  def validate_doc_request(request_json):
    """Validate document request"""
    max_gdrive_ids = 10
    if "gdrive_ids" not in request_json:
      raise exceptions.BadRequest("gdrive_ids is mandatory")
    elif len(request_json["gdrive_ids"]) > max_gdrive_ids:
      raise exceptions.BadRequest("more than 10 gdrive_ids is not allowed")

  @staticmethod
  def build_doc_exists_response(request_json, result_set):
    """Helper build json response from requested gdrive_ids and result_set

    Return:
        list of dict with results of api execution

    Example:
        [{
            u'object': {
                u'type': u'Document',
                u'id': 33
            },
            u'gdrive_id': u'123',
            u'exists': True
        },
        {
            u'object': None,
            u'gdrive_id': u'999',
            u'exists': False
        }]
    """

    response = []
    existing_doc_gdrive_ids = set()
    for doc_id, gdrive_id in result_set:
      response.append({
          "gdrive_id": gdrive_id,
          "object": {
              "type": "Document",
              "id": doc_id
          },
          "exists": True
      })
      existing_doc_gdrive_ids.add(gdrive_id)

    requested_gdrive_ids = request_json["gdrive_ids"]
    non_existing_docs = set(requested_gdrive_ids) - existing_doc_gdrive_ids

    for gdrive_id in non_existing_docs:
      response.append({
          "gdrive_id": gdrive_id,
          "object": None,
          "exists": False
      })

    return response

  @staticmethod
  def build_make_admin_response(request_json, docs):
    """Helper build json response from requested gdrive_ids and result_set

    Return:
        list of dict with results of api execution

    Example:
        [{
            u'object': {
                u'type': u'Document',
                u'id': 33
            },
            u'gdrive_id': u'123',
            u'updated': True
        },
        {
            u'object': None,
            u'gdrive_id': u'999',
            u'updated': False
        }]
    """

    response = []
    existing_doc_gdrive_ids = set()
    for doc in docs:
      response.append({
          "gdrive_id": doc.gdrive_id,
          "object": {
              "type": "Document",
              "id": doc.id
          },
          "updated": True
      })
      existing_doc_gdrive_ids.add(doc.gdrive_id)

    requested_gdrive_ids = request_json["gdrive_ids"]
    non_existing_docs = set(requested_gdrive_ids) - existing_doc_gdrive_ids

    for gdrive_id in non_existing_docs:
      response.append({
          "gdrive_id": gdrive_id,
          "object": None,
          "updated": False
      })
    return response


def external_user_only(func):
  """Decorator for functions that require be used only as external user."""
  # pylint: disable=missing-docstring
  @wraps(func)
  def wrapped(*args, **kwargs):
    if not is_external_app_user():
      raise exceptions.Forbidden()
    return func(*args, **kwargs)
  return wrapped


def validate_request_data_keys(required_keys_list):
  """
    Post request parameters validator. Validates presence
    of all required keys in json data supplied within request.
  """
  # pylint: disable=missing-docstring
  def wrap(decorated_function):
    @wraps(decorated_function)
    def wrapper(*args, **kwargs):
      error_message = ""
      request_data = {}
      if request.method in ("POST", "PUT"):
        request_data = request.get_json()
      elif request.method == "GET":
        request_data = request.args
      for key in required_keys_list:
        if key not in request_data:
          error_message = (u"Key '{}' is missing "
                           u"in request data".format(key))
          break
      if error_message:
        raise exceptions.BadRequest(error_message)
      return decorated_function(*args, **kwargs)
    return wrapper
  return wrap
