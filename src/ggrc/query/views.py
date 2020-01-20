# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""This module contains logic to handle '/query' endpoint."""

import time
import logging
from wsgiref.handlers import format_date_time

from flask import request
from flask import current_app
from werkzeug.exceptions import BadRequest

from ggrc.models import all_models
from ggrc.query.exceptions import BadQueryException
from ggrc.query.default_handler import DefaultHandler
from ggrc.login import login_required
from ggrc.models.inflector import get_model
from ggrc.services.common import etag
from ggrc.utils import as_json
from ggrc.utils import benchmark
from ggrc.utils.error_handlers import make_error_response


logger = logging.getLogger()


def build_collection_representation(model, description):
  """Enclose collection description into a type-describing block."""
  # pylint: disable=protected-access
  collection = {
      model.__name__: description,
  }
  return collection


def json_success_response(response_object, last_modified=None, status=200):
  """Build a 200-response with metadata headers."""
  headers = [
      ('Etag', etag(response_object)),
      ('Content-Type', 'application/json'),
  ]
  if last_modified is not None:
    headers.append(('Last-Modified', http_timestamp(last_modified)))

  return current_app.make_response(
      (as_json(response_object), status, headers),
  )


def http_timestamp(timestamp):
  """
    Http timestamp helper function.
  """
  return format_date_time(time.mktime(timestamp.utctimetuple()))


def get_handler_results(query):
  """Get results from the best matching query handler.

  Args:
    query: dict containing query parameters.
  Returns:
    dict containing json serializable query results.
  """

  query_handler = DefaultHandler(query)
  name = query_handler.__class__.__name__
  with benchmark("Get query Handler results from: {}".format(name)):
    return query_handler.get_results()


def get_objects_by_query():
  """Return objects corresponding to a POST'ed query list."""
  query = request.json

  results = get_handler_results(query)

  last_modified_list = [result["last_modified"] for result in results
                        if result["last_modified"]]
  last_modified = max(last_modified_list) if last_modified_list else None
  collections = []
  collection_fields = ["ids", "values", "count", "total", "object_name"]

  for result in results:
    model = get_model(result["object_name"])

    if model is not None:
      collection = build_collection_representation(
          model,
          {
              field: result[field] for field in collection_fields
              if field in result
          }
      )
      collections.append(collection)

  return json_success_response(collections, last_modified)


def init_query_views(app):
  """Function which creates route for query API."""
  # pylint: disable=unused-variable
  @app.route('/query', methods=['POST'])
  @login_required
  def query_objects():
    """Advanced object collection queries view."""
    try:
      return get_objects_by_query()
    except (NotImplementedError, BadQueryException) as exc:
      raise BadRequest(exc.message)


@login_required
def _clone_objects(model):
  """Clone object view."""
  try:
    return model.handle_model_clone(request.json[0])
  except BadQueryException as exc:
    raise BadRequest(exc.message)


def init_clone_views(app):
  """Initialize clonning api endpoints."""
  from ggrc.models.mixins import clonable
  for model in all_models.all_models:
    if issubclass(model, clonable.MultiClonable):
      url = "/api/{}/clone".format(model._inflector.table_singular)
      app.route(url, methods=['POST'])(lambda m=model: _clone_objects(m))


def validate_post_data_keys(required_keys_list):
  """
    Post request parameters validator. Validates presence
    of all required keys in json data supplied within request.
  """
  # pylint: disable=missing-docstring
  def wrap(decorated_function):
    def wrapper(*decorated_function_args):
      request_data = request.get_json()
      for key in required_keys_list:
        if key not in request_data:
          return make_error_response(
              u"Key '{}' is missing in request data".format(key),
              400,
              force_json=True,
          )
      return decorated_function(*decorated_function_args)

    return wrapper
  return wrap
