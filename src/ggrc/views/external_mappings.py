# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""This module provides endpoints for all_models.ExternalMapping model"""


import logging

from flask import request
import sqlalchemy as sa

from ggrc import db
from ggrc.app import app
from ggrc.query.views import json_success_response
from ggrc.utils.error_handlers import make_error_response
from ggrc.models import CustomAttributeDefinition
from ggrc.models.exceptions import ValidationError, IntegrityError
from ggrc.models.external_mapper import ExternalMapping
from ggrc.views.utils import external_user_only, validate_request_data_keys

logger = logging.getLogger(__name__)


@app.route("/api/external_mappings", methods=["GET"])
@validate_request_data_keys(["external_ids", "external_type"])
@external_user_only
def get_external_mapping_by_data():
  """
      Get ExternalMapping instance
  Returns:
      Flask Response object containing JSON representation of requested
      ExternalMapping or error message if error occurred.
  """

  logger.info("Get external mapping: external_id %s, external_type %s",
              request.args["external_ids"], request.args["external_type"])
  external_mapping = ExternalMapping.query.filter(
      sa.and_(
          ExternalMapping.external_id.in_(request.args["external_ids"]),
          ExternalMapping.external_type == request.args["external_type"]
      )
  ).all()

  if external_mapping:
    response_data = {
        ExternalMapping._inflector.table_singular: external_mapping
    }
    return json_success_response(response_data)

  return make_error_response(
      "No ExternalMapping records found with provided data",
      404,
      force_json=True,
  )


@app.route("/api/external_mappings", methods=["POST"])
@validate_request_data_keys(["object_type", "object_id",
                            "external_id", "external_type"])
@external_user_only
def create_external_mapping():
  """
      Create ExternalMapping instance
  Returns:
      Flask Response object containing JSON representation of created
      ExternalMapping or error message if error occurred.
  """
  request_data = request.get_json()
  logger.info("Create external mapping record: %s", request_data)

  try:
    external_mapping = ExternalMapping(**request_data)

    db.session.add(external_mapping)
    db.session.commit()

  except ValidationError as error:
    db.session.rollback()
    return make_error_response(error.message, 400, force_json=True)
  except IntegrityError as error:
    db.session.rollback()
    return make_error_response(error.message, 400, force_json=True)
  response_data = {
      ExternalMapping._inflector.table_singular: external_mapping}
  return json_success_response(response_data, status=201)


@app.route("/api/cad_external_mappings", methods=["GET"])
@validate_request_data_keys(["title", "definition_type"])
@external_user_only
def get_cad_for_external_mapping():
  """Gets CAD for external mapping.

  Args:
    title: A string representation of CAD title.
    definition_type: A string representation of definition type.
  Returns:
    Flask Response object containing JSON representation with id of CAD.
  """
  logger.info("Get CAD for external mapping: title %s, definition_type %s",
              request.args["title"], request.args["definition_type"])
  title = request.args["title"]
  definition_type = request.args["definition_type"]
  cad = CustomAttributeDefinition.query.filter(
      sa.and_(CustomAttributeDefinition.title == title,
              CustomAttributeDefinition.definition_type == definition_type)
  ).first()

  if cad:
    response_data = {"cad_id": cad.id}
    return json_success_response(response_data)

  return make_error_response(
      "No CAD records found with provided data",
      404,
      force_json=True,
  )
