# Copyright (C) 2019 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests for external mapper model."""


import ddt

from ggrc.models import all_models
from integration.external_app.external_api_helper import ExternalApiClient
from integration.ggrc import TestCase
from integration.ggrc import api_helper


@ddt.ddt
class TestExternalMapper(TestCase):
  """Tests for ExternalMapper model"""

  def setUp(self):
    """setUp, nothing else to add."""
    super(TestExternalMapper, self).setUp()
    self.ext_api = ExternalApiClient()
    self.api = api_helper.Api()

  def _assert_mapper(self, cad, mapper):
    """Assertion of mapped attributes"""
    self.assertEqual(cad.id, mapper.object_id)
    self.assertEqual(cad.type, mapper.object_type)
    self.assertEqual(cad.external_id, mapper.external_id)
    self.assertEqual(cad.entity_type, mapper.external_type)

  @staticmethod
  def _get_text_payload(model):
    """Gets payload for external text GCA.

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
        "entity_name": "CustomAttribute",
    }
    return payload

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
    mapper = all_models.ExternalMapping.query.all()

    self.assertEqual(len(mapper), 1)
    self._assertMapper(cad, mapper[0])

  @ddt.data(*all_models.get_internal_GRC_models())
  def test_mapper_not_created(self, model):
    """Test that ExternalMapper not created for {0.__name__} as normal user"""
    data = {"custom_attribute_definition": self._get_text_payload(model)}
    data["custom_attribute_definition"].pop("external_id")
    data["custom_attribute_definition"].pop("external_name")
    data["custom_attribute_definition"].pop("entity_name")

    response = self.api.post(all_models.CustomAttributeDefinition, data=data)

    self.assert201(response)

    mapper_count = len(all_models.ExternalMapping.query.all())
    self.assertEqual(mapper_count, 0)
