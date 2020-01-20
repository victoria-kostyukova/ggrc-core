# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""This module provides endpoints to add/remove SavedSearch models"""

from flask import request
import sqlalchemy as sa

from ggrc import db
from ggrc import login
from ggrc.app import app
from ggrc.query.views import json_success_response, validate_post_data_keys
from ggrc.utils.error_handlers import make_error_response
from ggrc.models.saved_search import SavedSearch
from ggrc.models.exceptions import ValidationError


@app.route("/api/saved_searches/<int:saved_search_id>", methods=["GET"])
def get_saved_searches_by_id(saved_search_id):
  """Get a saved search by ID.

  Endpoint returning saved search JSON representation by it's ID. Request
  should contain saved search ID. If there isn't any saved search with provided
  ID, 404 status code and "No saved search with id <id> found" message will be
  returned.

  Args:
    saved_search_id (int): ID of saved search to look for.

  Returns:
    Flask Response object containing JSON representation of saved search or
    error message if saved search was not found.
  """
  saved_search = SavedSearch.query.filter(
      SavedSearch.id == saved_search_id
  ).first()

  if saved_search:
    response_data = {
        SavedSearch.__name__: saved_search
    }

    return json_success_response(response_data)
  return make_error_response(
      "No saved search with id {} found".format(
          saved_search_id,
      ),
      404,
      force_json=True,
  )


@app.route("/api/saved_searches/<string:search_type>", methods=["GET"])
def get_saved_searches_by_type(search_type):
  """Get saved searches by type.

  Endpoint returning saved searches JSON representation by their type. Request
  should contain saved search type and can include offset and limit parameters.
  If there isn't any saved searches with provided type, empty response will be
  returned.

  Note that only saved searches marked as "visible" will be returned.

  Args:
    search_type (str): Type of saved search.

  Returns:
    Flask Response object with object_name, count, total and values as payload.
  """
  user = login.get_current_user(use_external_user=False)
  all_objects = user.saved_searches.filter(
      SavedSearch.search_type == search_type,
      SavedSearch.is_visible == sa.true(),
  )
  if search_type == SavedSearch.ADVANCED_SEARCH or \
      (search_type == SavedSearch.GLOBAL_SEARCH and
          "object_type" in request.args):
    all_objects = all_objects.filter(
        SavedSearch.object_type == request.args.get("object_type")
    )
  db_query_result = all_objects.order_by(
      SavedSearch.created_at.desc()
  ).offset(
      request.args.get("offset")
  ).limit(
      request.args.get("limit")
  ).all()

  response_data = {
      "object_name": SavedSearch.__name__,
      "count": len(db_query_result),
      "total": all_objects.count(),
      "values": db_query_result,
  }

  return json_success_response(response_data)


@app.route("/api/saved_searches/<int:saved_search_id>", methods=["DELETE"])
def delete_saved_search(saved_search_id):
  """Delete saved search by ID.

  Endpoint deleting saved search by it's ID. Request should contain saved
  search ID. If saved search is successfully deleted, it's ID will be returned.
  If there isn't any saved search with provided ID, 404 status code and
  "No saved search with id <id> found for current user" message will be
  returned.

  Args:
    saved_search_id (int): ID of saved search to delete

  Returns:
    Flask Response object containing ID of deleted saved search or error
    message if saved search is not found.
  """
  user = login.get_current_user(use_external_user=False)

  saved_search = user.saved_searches.filter(
      SavedSearch.id == saved_search_id
  ).first()

  if not saved_search:
    return make_error_response(
        "No saved search with id {} found for current user".format(
            saved_search_id,
        ),
        404,
        force_json=True,
    )

  db.session.delete(saved_search)
  db.session.commit()

  return json_success_response({"deleted": saved_search_id})


@app.route("/api/saved_searches", methods=["POST"])
@validate_post_data_keys(["object_type", "search_type"])
def create_saved_search():
  """Create a saved search.

  Endpoint creating saved search with provided parameters. Request payload
  should contain saved search `search_type` and `object_type`. Also it
  could contain saved search `name`, `filters`, and `is_visible` parameters. If
  there will any error during saved search creation, 400 status code and
  corresponding error will be returned.

  If no `name` parameter is provided, it will be generated atimatically.
  If no `is_visible` parameter is provided, the default value will be used.
    Defaults to `True`.

  Returns:
    Flask Response object containing JSON representation of created saved
    search or error message if error occurred.
  """
  user = login.get_current_user(use_external_user=False)

  data = request.get_json()

  try:
    search = SavedSearch(
        data.get("name"),
        data.get("object_type"),
        user,
        data.get("search_type"),
        data.get("filters"),
        data.get("is_visible", True),
    )
  except ValidationError as error:
    return make_error_response(error.message, 400, force_json=True)

  user.saved_searches.append(search)
  db.session.commit()

  return json_success_response(search)
