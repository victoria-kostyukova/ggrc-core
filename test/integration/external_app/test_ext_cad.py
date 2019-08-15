# Copyright (C) 2019 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Tests external CAD actions (create, update, etc.)"""

import json

import ddt

from ggrc.models import all_models

from integration.external_app import external_api_helper
from integration.ggrc.models import factories
from integration.ggrc.services.test_custom_attributes import ProductTestCase


@ddt.ddt
class TestExternalGlobalCustomAttributes(ProductTestCase):
  """Test case for external cads."""

  @classmethod
  def setUpClass(cls):
    cls.api = external_api_helper.ExternalApiClient()

  @staticmethod
  def _get_text_payload():
    """Gets payload for text GCA.

    Returns:
      Dictionary with attribute configuration.
    """
    return {
        "id": 1,
        "title": "GCA Text",
        "attribute_type": "Text",
        "definition_type": "control",
        "mandatory": False,
        "helptext": "GCA Text attribute",
        "placeholder": "Input text",
        "context": None,
        "external_id": 1,
    }

  @staticmethod
  def _get_rich_text_payload():
    """Gets payload for rich text GCA.

    Returns:
      Dictionary with attribute configuration.
    """
    return {
        "id": 1,
        "title": "GCA Rich Text",
        "attribute_type": "Rich Text",
        "definition_type": "control",
        "mandatory": False,
        "helptext": "GCA Text attribute",
        "placeholder": "Input text",
        "context": None,
        "external_id": 1,
    }

  @staticmethod
  def _get_date_payload():
    """Gets payload for date GCA.

    Returns:
      Dictionary with attribute configuration.
    """
    return {
        "id": 1,
        "title": "GCA Date",
        "attribute_type": "Date",
        "definition_type": "control",
        "mandatory": False,
        "helptext": "GCA Date attribute",
        "context": None,
        "external_id": 1,
    }

  @staticmethod
  def _get_dropdown_payload():
    """Gets payload for dropdown GCA.

    Returns:
      Dictionary with attribute configuration.
    """
    return {
        "id": 1,
        "title": "GCA Dropdown",
        "attribute_type": "Dropdown",
        "definition_type": "control",
        "mandatory": False,
        "helptext": "GCA Dropdown attribute",
        "context": None,
        "external_id": 1,
        "multi_choice_options": "1,3,2",
    }

  @staticmethod
  def _get_multiselect_payload():
    """Gets payload for multiselect GCA.

    Returns:
      Dictionary with attribute configuration.
    """
    return {
        "id": 1,
        "title": "GCA Multiselect",
        "attribute_type": "Multiselect",
        "definition_type": "control",
        "mandatory": False,
        "helptext": "GCA Multiselect attribute",
        "context": None,
        "external_id": 1,
        "multi_choice_options": "1,3,2",
    }

  @classmethod
  def _get_payload(cls, attribute_type):
    """Gets payload for GCA by attribute type.

    Args:
      attribute_type: String representation of attribute type.
    Returns:
      Dictionary with attribute configuration.
    """
    payload_handlers = {
        "Text": cls._get_text_payload,
        "Rich Text": cls._get_rich_text_payload,
        "Date": cls._get_date_payload,
        "Dropdown": cls._get_dropdown_payload,
        "Multiselect": cls._get_multiselect_payload,
    }

    return payload_handlers[attribute_type]()

  def _run_text_asserts(self, external_cad, attribute_payload):
    """Runs CAD text/rich asserts.

    Args:
      external_cad: CAD for validation.
      attribute_payload: Dictionary with attribute configuration.
    """
    self.assertEqual(
        external_cad.title,
        attribute_payload["title"]
    )
    self.assertEqual(
        external_cad.definition_type,
        attribute_payload["definition_type"]
    )
    self.assertEqual(
        external_cad.attribute_type,
        attribute_payload["attribute_type"]
    )
    self.assertEqual(
        external_cad.mandatory,
        attribute_payload["mandatory"]
    )
    self.assertEqual(
        external_cad.helptext,
        attribute_payload["helptext"]
    )
    self.assertEqual(
        external_cad.placeholder,
        attribute_payload["placeholder"]
    )

  def _run_date_asserts(self, external_cad, attribute_payload):
    """Runs CAD date asserts.

    Args:
      external_cad: CAD for validation.
      attribute_payload: Dictionary with attribute configuration.
    """
    self.assertEqual(
        external_cad.title,
        attribute_payload["title"]
    )
    self.assertEqual(
        external_cad.definition_type,
        attribute_payload["definition_type"]
    )
    self.assertEqual(
        external_cad.attribute_type,
        attribute_payload["attribute_type"]
    )
    self.assertEqual(
        external_cad.mandatory,
        attribute_payload["mandatory"]
    )
    self.assertEqual(
        external_cad.helptext,
        attribute_payload["helptext"]
    )

  def _run_select_asserts(self, external_cad, attribute_payload):
    """Runs CAD dropdown/multiselect asserts.

    Args:
      external_cad: CAD for validation.
      attribute_payload: Dictionary with attribute configuration.
    """
    self.assertEqual(
        external_cad.title,
        attribute_payload["title"]
    )
    self.assertEqual(
        external_cad.definition_type,
        attribute_payload["definition_type"]
    )
    self.assertEqual(
        external_cad.attribute_type,
        attribute_payload["attribute_type"]
    )
    self.assertEqual(
        external_cad.mandatory,
        attribute_payload["mandatory"]
    )
    self.assertEqual(
        external_cad.helptext,
        attribute_payload["helptext"]
    )
    self.assertEqual(
        external_cad.multi_choice_options,
        attribute_payload["multi_choice_options"]
    )

  def _run_cad_asserts(self, attribute_type, external_cad, attribute_payload):
    """Runs CAD asserts by attribute type.

    Args:
      external_cad: CAD for validation.
      attribute_type: String representation of attribute type.
      attribute_payload: Dictionary with attribute configuration.
    """
    asserts = {
        "Text": self._run_text_asserts,
        "Rich Text": self._run_text_asserts,
        "Date": self._run_date_asserts,
        "Dropdown": self._run_select_asserts,
        "Multiselect": self._run_select_asserts,
    }
    asserts[attribute_type](external_cad, attribute_payload)

  @ddt.data("Text", "Rich Text", "Date", "Dropdown", "Multiselect")
  def test_create_custom_attribute(self, attribute_type):
    """Test for create external CAD validation."""
    attribute_payload = self._get_payload(attribute_type)
    payload = [
        {
            "custom_attribute_definition": attribute_payload,
        }
    ]

    response = self.api.post(
        all_models.ExternalCustomAttributeDefinition,
        data=payload
    )

    self.assertEqual(response.status_code, 200)
    ex_cad = all_models.ExternalCustomAttributeDefinition.eager_query().first()
    self._run_cad_asserts(attribute_type, ex_cad, attribute_payload)

  @ddt.data("Text", "Rich Text", "Date", "Dropdown", "Multiselect")
  def test_update_custom_attribute(self, attribute_type):
    """Test for update external CAD validation."""
    external_cad = factories.ExternalCustomAttributeDefinitionFactory(
        title="GCA example",
        definition_type="control",
    )
    attribute_payload = self._get_payload(attribute_type)
    attribute_payload['id'] = external_cad.id
    payload = {
        "custom_attribute_definition": attribute_payload,
    }

    response = self.api.put(
        all_models.ExternalCustomAttributeDefinition,
        obj_id=external_cad.id,
        data=payload
    )

    self.assertEqual(response.status_code, 200)
    ex_cad = all_models.ExternalCustomAttributeDefinition.eager_query().first()
    self._run_cad_asserts(attribute_type, ex_cad, attribute_payload)

  @ddt.data("Text", "Rich Text", "Date", "Dropdown", "Multiselect")
  def test_get_custom_attribute(self, attribute_type):
    """Test for get external CAD validation."""
    attribute_payload = self._get_payload(attribute_type)
    external_cad = factories.ExternalCustomAttributeDefinitionFactory(
        **attribute_payload
    )

    response = self.api.get(
        all_models.ExternalCustomAttributeDefinition,
        external_cad.id
    )

    self.assertEqual(response.status_code, 200)
    response_json = json.loads(response.data)
    self._run_cad_asserts(
        attribute_type,
        external_cad,
        response_json["external_custom_attribute_definition"]
    )
