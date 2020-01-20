# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests for /query api endpoint."""

import ddt

from ggrc.app import db
from ggrc import models
from ggrc.models import custom_attribute_definition as cad

from integration import ggrc
from integration.ggrc import api_helper
from integration.ggrc.models import factories
from integration.ggrc import query_helper


@ddt.ddt
class TestCADReindex(query_helper.WithQueryApi, ggrc.TestCase):
  """Tests reindex after CustomAttributeDefinition changes"""
  def setUp(self):
    super(TestCADReindex, self).setUp()
    self.client.get("/login")
    self.api = api_helper.Api()

  @staticmethod
  def _create_cad_body(title, attribute_type, definition_type, model_name):
    """Create body for CAD POST request"""
    body = {
        "custom_attribute_definition": {
            "title": title,
            "attribute_type": attribute_type,
            "definition_type": definition_type,
            "modal_title": "Add Attribute to type %s" % model_name,
            "mandatory": False,
            "helptext": "",
            "placeholder": "",
            "context": {
                "id": None
            }
        }
    }
    if attribute_type == "Multiselect":
      body["custom_attribute_definition"]["multi_choice_options"] = "yes,no"
    return body

  @ddt.data(
      ("assessment", "Checkbox", "no"),
      ("assessment", "Multiselect", ""),
      ("assessment", "Text", ""),
      ("audit", "Checkbox", "no"),
      ("audit", "Multiselect", ""),
      ("audit", "Text", ""),
  )
  @ddt.unpack
  def test_reindex_cad_create(self, definition_type, attribute_type, value):
    """Test reindex after CAD creating"""
    model_name = cad.get_inflector_model_name_dict()[definition_type]
    model_id = factories.get_model_factory(model_name)().id
    expected = [model_id]
    title = "test_title %s %s" % (definition_type, attribute_type)
    cad_model = models.all_models.CustomAttributeDefinition
    response = self.api.post(cad_model, [
        self._create_cad_body(
            title, attribute_type, definition_type, model_name
        )
    ])
    self.assert200(response)
    ids = self.simple_query(
        model_name,
        expression=[title, "=", value],
        type_="ids",
        field="ids"
    )
    self.assertItemsEqual(ids, expected)

  @ddt.data(
      ("assessment", "Checkbox", "no"),
      ("assessment", "Multiselect", ""),
      ("assessment", "Text", ""),
      ("audit", "Checkbox", "no"),
      ("audit", "Multiselect", ""),
      ("audit", "Text", ""),
  )
  @ddt.unpack
  def test_reindex_cad_delete(self, definition_type, attribute_type, value):
    """Test reindex after CAD deleting"""
    model_name = cad.get_inflector_model_name_dict()[definition_type]
    title = "test_title %s %s" % (definition_type, attribute_type)
    cad_model = models.all_models.CustomAttributeDefinition
    response = self.api.post(cad_model, [
        self._create_cad_body(
            title, attribute_type, definition_type, model_name
        )
    ])
    self.assert200(response)

    cad_obj = db.session.query(cad_model).filter_by(title=title).first()
    response = self.api.delete(cad_obj)
    self.assert200(response)

    ids = self.simple_query(
        model_name,
        expression=[title, "=", value],
        type_="ids",
        field="ids"
    )
    self.assertItemsEqual(ids, [])
