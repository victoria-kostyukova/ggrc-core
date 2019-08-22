# Copyright (C) 2019 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests for task group task specific export."""
import json

import ddt

from ggrc import db
from ggrc.models import all_models
from ggrc.utils import iso_to_us_date
from integration.ggrc.models import factories
from integration.ggrc import TestCase
from integration.ggrc.utils import helpers


@ddt.ddt
class TestExportControls(TestCase):
  """Test imports for basic control objects."""

  model = all_models.Control

  def setUp(self):
    with factories.single_commit():
      super(TestExportControls, self).setUp()
      self.client.get("/login")
      self.headers = {
          'Content-Type': 'application/json',
          "X-Requested-By": "GGRC",
          "X-export-view": "blocks",
      }
      with factories.single_commit():
        self.basic_owner = factories.PersonFactory(name="basic owner")
        self.control = factories.ControlFactory()
        self.control.add_person_with_role_name(self.basic_owner, "Admin")

  def test_search_by_owner_email(self):
    self.assert_slugs("Admin",
                      self.basic_owner.email,
                      [self.control.slug])

  def test_search_by_owner_name(self):
    self.assert_slugs("Admin",
                      self.basic_owner.name,
                      [self.control.slug])

  def test_search_by_new_owner(self):
    """Filter by added new owner and old owner"""
    basic_email, basic_name = self.basic_owner.email, self.basic_owner.name
    with factories.single_commit():
      new_owner = factories.PersonFactory(name="new owner")
      self.control.add_person_with_role_name(new_owner, "Admin")

    new_owner_email = new_owner.email
    new_owner_name = new_owner.email
    control_slug = self.control.slug

    self.client.post("/admin/full_reindex")

    self.assert_slugs("Admin",
                      new_owner_email,
                      [control_slug])
    self.assert_slugs("Admin",
                      new_owner_name,
                      [control_slug])
    self.assert_slugs("Admin",
                      basic_email,
                      [control_slug])
    self.assert_slugs("Admin",
                      basic_name,
                      [control_slug])

  def test_search_by_deleted_owner(self):
    """Filter by deleted owner"""
    all_models.AccessControlPerson.query.delete()
    db.session.commit()
    self.assert_slugs("owners", self.basic_owner.email, [])
    self.assert_slugs("owners", self.basic_owner.name, [])

  @ddt.data(
      ("kind", "Kind/Nature"),
      ("means", "Type/Means"),
      ("verify_frequency", "Frequency"),
  )
  @ddt.unpack
  def test_option_fields_export(self, field, alias):
    """Test export several controls with option fields."""
    with factories.single_commit():
      expected_values = []
      for _ in range(3):
        obj = factories.ControlFactory()
        field_val = factories.random_str(prefix=field).title()
        setattr(obj, field, field_val)
        expected_values.append(field_val)

    data = [{
        "object_name": "Control",
        "filters": {
            "expression": {
                "left": field,
                "op": {"name": "~"},
                "right": field,
            }
        },
        "fields": "all",
    }]
    response = self.export_csv(data)
    self.assert200(response)
    self.assertIn(alias, response.data)

    exported_values = helpers.parse_export_data(response.data)
    self.assertEqual(exported_values[alias], expected_values)

  @ddt.data(
      ("assertions", "Assertions"),
      ("categories", "Categories"),
  )
  @ddt.unpack
  def test_category_fields_export(self, field, alias):
    """Test export several controls with category fields."""
    with factories.single_commit():
      expected_values = []
      for _ in range(3):
        field_vals = [factories.random_str(prefix=field) for _ in range(3)]
        factories.ControlFactory(**{field: json.dumps(field_vals)})
        expected_values.append("\n".join(field_vals))

    data = [{
        "object_name": "Control",
        "filters": {
            "expression": {
                "left": field,
                "op": {"name": "~"},
                "right": field,
            }
        },
        "fields": "all",
    }]
    response = self.export_csv(data)
    self.assert200(response)
    self.assertIn(alias, response.data)

    exported_values = helpers.parse_export_data(response.data)
    self.assertEqual(exported_values[alias], expected_values)

  @ddt.data(
      ("Date", None, "2019-08-01"),
      ("Multiselect", "yes,no", "no,yes"),
      ("Rich Text", None, "sample text"),
      ("Dropdown", "one,two,three,four,five", "four"),
  )
  @ddt.unpack
  def test_control_export_with_ecad(self, attribute_type, multi_choice_options,
                                    attribute_value):
    """Test exporting of control with filtering by external cad."""
    with factories.single_commit():
      cad = factories.ExternalCustomAttributeDefinitionFactory(
          definition_type="control",
          attribute_type=attribute_type,
          multi_choice_options=multi_choice_options,
      )
      control = factories.ControlFactory(slug="Control 1")
      factories.ExternalCustomAttributeValueFactory(
          attributable=control,
          custom_attribute=cad,
          attribute_value=attribute_value,
      )

    search_request = [{
        "object_name": "Control",
        "filters": {
            "expression": {
                "left": cad.title,
                "op": {"name": "="},
                "right": attribute_value,
            },
        },
    }]
    parsed_data = self.export_parsed_csv(search_request)["Control"][0]
    self.assertIn(cad.title, parsed_data)
    if attribute_type == "Date":
      attribute_value = iso_to_us_date(attribute_value)
    self.assertEqual(parsed_data[cad.title], attribute_value)
