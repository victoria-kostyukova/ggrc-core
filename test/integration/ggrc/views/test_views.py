# Copyright (C) 2019 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Tests for extra views."""

import json

import ddt
import sqlalchemy as sa

from ggrc.models.relationship import Relationship
from integration.ggrc import TestCase
from integration.ggrc.models import factories


@ddt.ddt
class TestUnmapObjects(TestCase):
  """Test for "unmap_objects" view."""

  ENDPOINT_URL = "/api/relationships/unmap"

  def setUp(self):
    super(TestUnmapObjects, self).setUp()
    headers = {"X-GGRC-User": "{\"email\":\"external_app@example.com\"}"}
    self.client.get("/login", headers=headers)

  def test_internal_user_request(self):
    """Test internal user has not access to endpoint."""
    self.client.get("/logout")
    self.client.get("/login")

    body = {
        "first_object_id": 1,
        "first_object_type": "Control",
        "second_object_id": 1,
        "second_object_type": "Product",
    }

    response = self.client.post(self.ENDPOINT_URL,
                                content_type="application/json",
                                data=json.dumps(body))

    self.assertEqual(403, response.status_code)

  @ddt.data(
      "first_object_id",
      "first_object_type",
      "second_object_id",
      "second_object_type",
  )
  def test_mandatory_fields(self, field):
    """Test mandatory fields validation."""
    body = {
        "first_object_id": 1,
        "first_object_type": "Control",
        "second_object_id": 1,
        "second_object_type": "Product",
    }
    del body[field]

    response = self.client.post(self.ENDPOINT_URL,
                                content_type="application/json",
                                data=json.dumps(body))

    self.assertEqual(400, response.status_code)

    expected_message = "Missing mandatory attribute: %s." % field
    actual_message = json.loads(response.data)["message"]
    self.assertEqual(expected_message, actual_message)

  @ddt.data(
      ("first_object_id", "id", "first"),
      ("first_object_type", "type", "first"),
      ("second_object_id", "id", "second"),
      ("second_object_type", "type", "second"),
  )
  @ddt.unpack
  def test_invalid_type(self, field, field_type, field_number):
    """Test field type validation."""
    body = {
        "first_object_id": 1,
        "first_object_type": "Control",
        "second_object_id": 1,
        "second_object_type": "Product",
    }
    body[field] = None

    response = self.client.post(self.ENDPOINT_URL,
                                content_type="application/json",
                                data=json.dumps(body))

    self.assertEqual(400, response.status_code)

    expected_message = "Invalid object %s for %s object." % (field_type,
                                                             field_number)
    actual_message = json.loads(response.data)["message"]
    self.assertEqual(expected_message, actual_message)

  def test_unmapping(self):
    """Test field type validation."""
    with factories.single_commit():
      first_object = factories.ProjectFactory()
      first_type = first_object.type
      first_id = first_object.id
      second_object = factories.ProgramFactory()
      second_type = second_object.type
      second_id = second_object.id

      relationship_1 = factories.RelationshipFactory(
          source=first_object,
          destination=second_object,
          is_external=True).id
      relationship_2 = factories.RelationshipFactory(
          source=second_object,
          destination=first_object,
          is_external=True).id

    body = {
        "first_object_id": first_id,
        "first_object_type": first_type,
        "second_object_id": second_id,
        "second_object_type": second_type,
    }

    response = self.client.post(self.ENDPOINT_URL,
                                content_type="application/json",
                                data=json.dumps(body))

    self.assertEqual(200, response.status_code)

    deleted_count = json.loads(response.data)["count"]
    self.assertEqual(2, deleted_count)

    remained_count = Relationship.query.filter(
        sa.or_(
            sa.and_(
                Relationship.source_type == first_type,
                Relationship.source_id == first_id,
                Relationship.destination_type == second_type,
                Relationship.destination_id == second_id
            ),
            sa.and_(
                Relationship.source_type == second_type,
                Relationship.source_id == second_id,
                Relationship.destination_type == first_type,
                Relationship.destination_id == first_id
            )
        )
    ).count()
    self.assertEqual(0, remained_count)

    self.assertEqual(None, Relationship.query.get(relationship_1))
    self.assertEqual(None, Relationship.query.get(relationship_2))
