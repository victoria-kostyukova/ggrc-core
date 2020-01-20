# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests for control model."""
# pylint: disable=too-many-lines

import ddt

from ggrc import db
from ggrc.models import all_models
from integration.ggrc import TestCase
from integration.ggrc.models import factories
from integration.ggrc import api_helper


@ddt.ddt
class TestControl(TestCase):
  """Tests for control model."""

  def setUp(self):
    """setUp, nothing else to add."""
    super(TestControl, self).setUp()
    self.api = api_helper.Api()

  def test_control_read(self):
    """Test correctness of control field values on read operation."""
    control_body = {
        "title": "test control",
        "slug": "CONTROL-01",
        "kind": "test kind",
        "means": "test means",
        "verify_frequency": "test frequency",
    }
    control = factories.ControlFactory(**control_body)

    response = self.api.get(all_models.Control, control.id)

    self.assert200(response)
    self.assert_response_fields(response.json.get("control"), control_body)
    control = all_models.Control.query.get(control.id)
    self.assert_object_fields(control, control_body)

  def test_contorl_has_test_plan(self):
    """Check test plan setup to control."""
    control = factories.ControlFactory(test_plan="This is a test text")
    control = db.session.query(all_models.Control).get(control.id)

    self.assertEqual(control.test_plan, "This is a test text")

  @ddt.data(
      ("kind", factories.random_str()),
      ("means", factories.random_str()),
      ("verify_frequency", factories.random_str()),
      ("assertions", ["assertion1", "assertion2"]),
      ("assertions", []),
      ("categories", ["c1", "c2", "c3"]),
      ("categories", []),
  )
  @ddt.unpack
  def test_control_new_revision(self, field, value):
    """Test if content of new revision is correct for Control '{0}' field."""
    control = factories.ControlFactory(**{field: value})

    response = self.api.client.get(
        "/api/revisions"
        "?resource_type={}&resource_id={}".format(control.type, control.id)
    )

    self.assert200(response)
    revisions = response.json["revisions_collection"]["revisions"]
    self.assertEqual(len(revisions), 1)
    self.assertEqual(revisions[0].get("content", {}).get(field), value)

  @ddt.data("kind", "means", "verify_frequency")
  def test_old_option_revision(self, field):
    """Test if old revision content is correct for Control '{0}' field."""
    field_value = factories.random_str()
    control = factories.ControlFactory(**{field: field_value})
    control_revision = all_models.Revision.query.filter_by(
        resource_type=control.type,
        resource_id=control.id
    ).one()
    revision_content = control_revision.content
    revision_content[field] = {
        "id": "123",
        "title": "some title",
        "type": "Option",
    }
    control_revision.content = revision_content
    db.session.commit()

    response = self.api.client.get(
        "/api/revisions"
        "?resource_type={}&resource_id={}".format(control.type, control.id)
    )

    self.assert200(response)
    revisions = response.json["revisions_collection"]["revisions"]
    self.assertEqual(len(revisions), 1)
    self.assertEqual(revisions[0].get("content", {}).get(field), "some title")

  @ddt.data(
      (
          "assertions",
          [
              {
                  "name": "Availability",
                  "type": "ControlAssertion",
                  "id": 39,
              },
              {
                  "name": "Security",
                  "type": "ControlAssertion",
                  "id": 40,
              },
          ],
          ["Availability", "Security"]
      ),
      (
          "categories",
          [
              {
                  "name": "Authentication",
                  "type": "ControlCategory",
                  "id": 49,
              },
              {
                  "name": "Monitoring",
                  "type": "ControlCategory",
                  "id": 55,
              },
          ],
          ["Authentication", "Monitoring"]
      ),
  )
  @ddt.unpack
  def test_old_category_revision(self, field, new_value, expected):
    """Test if old revision content is correct for Control '{0}' field."""
    control = factories.ControlFactory()
    control_revision = all_models.Revision.query.filter_by(
        resource_type=control.type,
        resource_id=control.id
    ).one()
    revision_content = control_revision.content
    revision_content[field] = new_value
    control_revision.content = revision_content
    db.session.commit()

    response = self.api.client.get(
        "/api/revisions"
        "?resource_type={}&resource_id={}".format(control.type, control.id)
    )

    self.assert200(response)
    revisions = response.json["revisions_collection"]["revisions"]
    self.assertEqual(len(revisions), 1)
    self.assertEqual(revisions[0].get("content", {}).get(field), expected)

  def test_json_deserialization(self):
    """Created_by attribute should contain person stub"""
    with factories.single_commit():
      creator_email = "creator@example.com"
      creator = factories.PersonFactory(email=creator_email)
      creator_id = creator.id
      control = factories.ControlFactory(
          title="Test control", created_by=creator,
          last_submitted_by=creator,
          last_verified_by=creator
      )

    json_representation = control.log_json()

    self.assertTrue(isinstance(json_representation["created_by"], dict))
    self.assertTrue(
        isinstance(json_representation["last_submitted_by"], dict)
    )
    self.assertTrue(isinstance(json_representation["last_verified_by"], dict))
    self.assertEquals(
        json_representation["created_by"]["email"], creator_email
    )
    self.assertEquals(
        json_representation["last_submitted_by"]["email"], creator_email
    )
    self.assertEquals(
        json_representation["last_verified_by"]["email"], creator_email
    )
    self.assertEquals(json_representation["created_by"]["id"], creator_id)
    self.assertEquals(
        json_representation["last_submitted_by"]["id"], creator_id
    )
    self.assertEquals(
        json_representation["last_verified_by"]["id"], creator_id
    )

  def test_create_control(self):
    """Test control update with internal user."""
    response = self.api.post(all_models.Control, {"title": "new-title"})

    self.assert403(response)
    control_count = db.session.query(all_models.Control).filter(
        all_models.Control.title == "new-title").count()
    self.assertEqual(0, control_count)

  def test_update_control(self):
    """Test control update with internal user."""
    control = factories.ControlFactory()
    old_title = control.title

    response = self.api.put(control, {"title": "new-title"})

    self.assert403(response)
    control = db.session.query(all_models.Control).get(control.id)
    self.assertEqual(old_title, control.title)

  def test_delete_control(self):
    """Test control update with internal user."""
    control = factories.ControlFactory()

    response = self.api.delete(control)

    self.assert403(response)
    control = db.session.query(all_models.Control).get(control.id)
    self.assertIsNotNone(control.title)
