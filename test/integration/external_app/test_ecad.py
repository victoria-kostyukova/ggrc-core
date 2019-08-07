# Copyright (C) 2019 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests related to external custom attributes."""

import ddt

from ggrc import models
from ggrc.models import custom_attribute_definition as cad
from integration import ggrc
from integration.external_app import external_api_helper
from integration.ggrc import query_helper
from integration.ggrc.models import factories


@ddt.ddt
class TestECADReindex(query_helper.WithQueryApi, ggrc.TestCase):
  """Tests reindex after CustomAttributeDefinition changes"""
  def setUp(self):
    super(TestECADReindex, self).setUp()
    self.client.get("/login")
    self.ext_api = external_api_helper.ExternalApiClient()

  @staticmethod
  def _create_cad_body(title, attribute_type, definition_type, model_name):
    """Create body for eCAD POST request"""
    body = {
        "custom_attribute_definition": {
            "id": 1,
            "external_id": 2,
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
      ("control", "Multiselect", ""),
      ("control", "Dropdown", ""),
      ("risk", "Rich Text", ""),
      ("risk", "Text", ""),
      ("risk", "Date", ""),
  )
  @ddt.unpack
  def test_reindex_cad_create(self, definition_type, attribute_type, value):
    """Test reindex after CAD creating"""
    model_name = cad.get_inflector_model_name_dict()[definition_type]
    model_id = factories.get_model_factory(model_name)().id
    expected = [model_id]
    title = "test_title %s %s" % (definition_type, attribute_type)
    cad_model = models.all_models.ExternalCustomAttributeDefinition
    response = self.ext_api.post(
        cad_model,
        data=[
            self._create_cad_body(
                title, attribute_type, definition_type, model_name
            )
        ]
    )
    self.assert200(response)
    ids = self.simple_query(
        model_name,
        expression=[title, "=", value],
        type_="ids",
        field="ids"
    )
    self.assertItemsEqual(ids, expected)

  @ddt.data(
      ("Date", None, "2019-08-01"),
      ("Multiselect", "yes,no", "no,yes"),
      ("Rich Text", None, "sample text"),
      ("Text", None, "sample text"),
      ("Dropdown", "one,two,three,four,five", "four"),
  )
  @ddt.unpack
  def test_control_reindex(self, attribute_type, multi_choice_options,
                           attribute_value):
    """Test reindex of control after edit of eCAV"""
    with factories.single_commit():
      ecad = factories.ExternalCustomAttributeDefinitionFactory(
          definition_type="control",
          attribute_type=attribute_type,
          multi_choice_options=multi_choice_options,
      )
      control = factories.ControlFactory(slug="Control 1")
    response = self.ext_api.put(control, control.id, data={
        "custom_attribute_values": [{
            "attributable_id": control.id,
            "attributable_type": "Control",
            "custom_attribute_id": ecad.id,
            "attribute_value": attribute_value,
        }]
    })
    self.assert200(response)
    ids = self.simple_query(
        "Control",
        expression=[ecad.title, "=", attribute_value],
        type_="ids",
        field="ids"
    )
    self.assertItemsEqual(ids, [control.id])


@ddt.ddt
class TestExtSnapshotting(query_helper.WithQueryApi, ggrc.TestCase):
  """Test snapshotting of objects with external CADs."""

  def setUp(self):
    super(TestExtSnapshotting, self).setUp()
    self.ext_api = external_api_helper.ExternalApiClient()
    self.client.get("/login")

  @ddt.data(
      ("Date", None, "2019-08-01"),
      ("Multiselect", "yes,no", "no,yes"),
      ("Rich Text", None, "sample text"),
      ("Text", None, "sample text"),
      ("Dropdown", "one,two,three,four,five", "four"),
  )
  @ddt.unpack
  def test_control_snapshotting(self, attribute_type, multi_choice_options,
                                attribute_value):
    """Test revisions and snapshots content contains
    external custom attributes."""
    with factories.single_commit():
      control = factories.ControlFactory(slug="Control 1")
      ecad = factories.ExternalCustomAttributeDefinitionFactory(
          definition_type="control",
          attribute_type=attribute_type,
          multi_choice_options=multi_choice_options,
      )
      factories.ExternalCustomAttributeValueFactory(
          custom_attribute=ecad,
          attributable=control,
          attribute_value=attribute_value,
      )
      audit = factories.AuditFactory()
    snapshots = self._create_snapshots(audit, [control])
    content = snapshots[0].revision.content
    self.assertEqual(content["custom_attribute_definitions"][0]["title"],
                     ecad.title)
    self.assertEqual(content["custom_attribute_values"][0]["attribute_value"],
                     attribute_value)


class TestECADResponse(ggrc.TestCase):
  """Check response from API of eCAD content"""

  def setUp(self):
    super(TestECADResponse, self).setUp()
    self.ext_api = external_api_helper.ExternalApiClient()
    self.client.get("/login")

  def test_cad_response(self):
    """Test response after creation of eCAD"""
    cad_body = {
        "custom_attribute_definition": {
            "id": 1,
            "external_id": 2,
            "title": "ECAD TiTle",
            "attribute_type": "Dropdown",
            "definition_type": "risk",
            "mandatory": True,
            "helptext": "Help Text",
            "placeholder": "Some Placeholder",
            "multi_choice_options": "opt1,opt2",
        }
    }
    cad_model = models.all_models.ExternalCustomAttributeDefinition
    response = self.ext_api.post(cad_model, data=cad_body)
    self.assert201(response)
    check_attrs = cad_body["custom_attribute_definition"].keys()
    for attr in check_attrs:
      self.assertIn(attr, response.json["custom_attribute_definition"])
      self.assertEqual(response.json["custom_attribute_definition"][attr],
                       cad_body["custom_attribute_definition"][attr])

  def test_cav_response(self):
    """Test response after creation of eCAD"""
    cad_body = {
        "custom_attribute_definition": {
            "id": 1,
            "external_id": 2,
            "title": "ECAD TiTle",
            "attribute_type": "Dropdown",
            "definition_type": "control",
            "mandatory": True,
            "helptext": "Help Text",
            "placeholder": "Some Placeholder",
            "multi_choice_options": "opt1,opt2",
        }
    }
    cad_model = models.all_models.ExternalCustomAttributeDefinition
    cad_response = self.ext_api.post(cad_model, data=cad_body)
    self.assert201(cad_response)
    control = factories.ControlFactory(slug="Control 1")
    cav_body = {
        "custom_attribute_values": [{
            "id": 1,
            "external_id": 2,
            "attributable_id": control.id,
            "attributable_type": "Control",
            "custom_attribute_id": 1,
            "attribute_value": "opt2",
        }]
    }
    response = self.ext_api.put(control, control.id, data=cav_body)
    self.assert200(response)
    cav_response = self.ext_api.get(control, control.id)
    json_cav = cav_response.json["control"]["custom_attribute_values"]
    check_attrs = cav_body["custom_attribute_values"][0].keys()
    for attr in check_attrs:
      self.assertIn(attr, json_cav[0])
      self.assertEqual(json_cav[0][attr],
                       cav_body["custom_attribute_values"][0][attr])
