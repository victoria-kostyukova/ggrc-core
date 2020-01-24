# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests for external mapper model."""

import ddt

from ggrc.models import all_models
from integration.external_app import external_api_helper
from integration.ggrc import TestCase, api_helper, factories


# pylint: disable=invalid-name
@ddt.ddt
class TestExternalMapper(TestCase):
  """Tests for ExternalMapper model"""

  def setUp(self):
    """setUp, nothing else to add."""
    super(TestExternalMapper, self).setUp()
    self.ext_api = external_api_helper.ExternalApiClient()
    self.api = api_helper.Api()

  def _assert_mapper(self, cad, mapper):
    """
      Assertion of mapped attributes
    Args:
      cad: an instance of CustomAttributeDefinition model
      mapper: an instance of ExternaMapping model
    """
    self.assertEqual(cad.id, mapper.object_id)
    self.assertEqual(cad.type, mapper.object_type)
    self.assertEqual(cad.external_id, mapper.external_id)
    self.assertEqual(cad.external_type, mapper.external_type)

  @staticmethod
  def _get_text_payload(model):
    """Gets payload for external text GCA.
    Args:
      model: an GGRC model
    Returns:
      Dictionary with attribute configuration.
    """
    payload = {
        "title": "GCA Text",
        "attribute_type": "Text",
        "definition_type": model._inflector.table_singular,
        "mandatory": False,
        "helptext": "GCA Text",
        "placeholder": "",
        "context": None,
        "external_id": 1,
        "external_name": "{}_string_11111".format(model.__name__),
        "external_type": "custom_attribute_definition",
    }
    return payload

  @staticmethod
  def _get_mapping_post_data(external_type, object_type):
    return {
        "external_id": 2,
        "external_type": external_type,
        "object_type": object_type,
        "object_id": 5
    }

  @staticmethod
  def _get_mapping_get_data(external_type):
    return {
        "external_id": 2,
        "external_type": external_type,
    }

  @ddt.data(*all_models.get_external_models())
  def test_mapper_is_created(self, model):
    """Test that ExternalMapper is created for {0.__name__} as external user"""

    data = {"custom_attribute_definition": self._get_text_payload(model)}
    response = self.ext_api.post(
        all_models.CustomAttributeDefinition,
        data=data
    )

    self.assert201(response)

    cad = all_models.CustomAttributeDefinition.query.first()
    mapping_records = all_models.ExternalMapping.query.all()

    self.assertEqual(len(mapping_records), 1)
    self._assert_mapper(cad, mapping_records[0])

  @ddt.data(*all_models.get_internal_grc_models())
  def test_mapper_not_created(self, model):
    """Test that ExternalMapper not created for {0.__name__} as normal user"""
    data = {"custom_attribute_definition": self._get_text_payload(model)}
    data["custom_attribute_definition"].pop("external_id")
    data["custom_attribute_definition"].pop("external_name")
    data["custom_attribute_definition"].pop("external_type")

    response = self.api.post(all_models.CustomAttributeDefinition, data=data)
    self.assert201(response)

    mapper_records = all_models.ExternalMapping.query.all()
    self.assertEqual(len(mapper_records), 0)

  def test_external_mapper_get_allowed(self):
    """Test GET request for ExternalMapping model as external"""

    factories.ExternalMappingFactory(
        object_type="custom_attribute_definition",
        object_id=1,
        external_id=2,
        external_type="custom_attribute_definition"
    )
    params = {
        "external_id": 2,
        "external_type": "custom_attribute_definition"
    }
    response = self.ext_api.get(url="/api/external_mappings", params=params)

    self.assert200(response)

    mapping = all_models.ExternalMapping.query.first()
    response_data = response.json['external_mapping']

    self.assertEqual(response_data["object_type"], mapping.object_type)
    self.assertEqual(response_data["object_id"], mapping.object_id)

  def test_external_mapper_get_cad(self):
    """Test GET request for CAD with external mapper."""

    cad = factories.CustomAttributeDefinitionFactory(
        title="text_GCA",
        definition_type="risk",
        attribute_type="Text",
    )
    params = {
        "title": cad.title,
        "definition_type": cad.definition_type
    }
    response = self.ext_api.get(
        url="/api/cad_external_mappings",
        params=params
    )

    self.assert200(response)

    self.assertEqual(response.json["cad_id"], cad.id)

  def test_external_mapper_cad_not_found(self):
    """Test GET request for CAD not found."""

    cad = factories.CustomAttributeDefinitionFactory(
        title="text_GCA",
        definition_type="risk",
        attribute_type="Text",
    )
    params = {
        "title": "not equal header",
        "definition_type": cad.definition_type,
    }
    response = self.ext_api.get(
        url="/api/cad_external_mappings",
        params=params
    )

    self.assert404(response)

  def test_external_mapper_post(self):
    """Test POST request for create ExternalMapping model as external"""

    data = self._get_mapping_post_data("custom_attribute_definition",
                                       "custom_attribute_definition")

    response = self.ext_api.post(all_models.ExternalMapping, data=data)
    self.assert201(response)

    mapping = all_models.ExternalMapping.query.first()

    for key in data:
      self.assertEqual(data[key],
                       getattr(mapping, key,
                               getattr(mapping, "external_type")))

  def test_external_mapping_unique_records(self):
    """Test that can't create duplicate records of ExternalMapping instances"""

    data = self._get_mapping_post_data("custom_attribute_definition",
                                       "custom_attribute_definition")

    response = self.ext_api.post(all_models.ExternalMapping, data=data)
    self.assert201(response)

    mappings = all_models.ExternalMapping.query.all()
    self.assertEqual(len(mappings), 1)

    response = self.ext_api.post(all_models.ExternalMapping, data=data)
    self.assert400(response)
    self.assertIn("IntegrityError", response.data)

    mappings = all_models.ExternalMapping.query.all()
    self.assertEqual(len(mappings), 1)

  def test_post_external_mapping_not_allowed(self):
    """Test POST request for create ExternalMapping model as normal"""

    data = self._get_mapping_post_data("custom_attribute_definition",
                                       "custom_attribute_definition")

    response = self.api.post(all_models.ExternalMapping, data=data)
    self.assert403(response)

  def test_not_all_data_for_post(self):
    """Test POST request for create ExternalMapping model w/o needed data"""

    data = self._get_mapping_post_data("custom_attribute_definition",
                                       "custom_attribute_definition")

    data.pop("external_id")

    response = self.ext_api.post(all_models.ExternalMapping, data=data)
    self.assert400(response)
    self.assertIn("Key 'external_id' is missing", response.data)

  def test_not_all_data_for_get(self):
    """Test GET request for create ExternalMapping model w/o needed data"""

    data = self._get_mapping_get_data("custom_attribute_definition")

    data.pop("external_id")

    response = self.ext_api.get(url="/api/external_mappings", params=data)
    self.assert400(response)
    self.assertIn("Key 'external_id' is missing", response.data)

  @ddt.data("external_id", "object_id")
  def test_validate_ids_fields(self, key):
    """Test for external_id and object_id fields validator"""

    data = self._get_mapping_post_data("custom_attribute_definition",
                                       "custom_attribute_definition")

    data[key] = "2"

    response = self.ext_api.post(all_models.ExternalMapping, data=data)
    self.assert400(response, "'{}' should be of int() type.".format(key))

  def test_validate_types_external_type(self):
    """Test for external_type field validator"""

    data = self._get_mapping_post_data("custom_attribute_definition",
                                       "custom_attribute_definition")

    data["external_type"] = "2"

    response = self.ext_api.post(all_models.ExternalMapping, data=data)
    self.assert400(response, "'external_type' value are not allowed.")
