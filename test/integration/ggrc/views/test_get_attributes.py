# -*- coding: utf-8 -*-
# Copyright (C) 2019 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Integration tests for get all attributes json"""

import json
import ddt

from ggrc.views import get_attributes_json
from ggrc.views import get_all_attributes_json

from integration.ggrc.services import TestCase
from integration.ggrc.models import factories


@ddt.ddt
class TestGetAttributes(TestCase):
  """Test get all attributes json"""

  def setUp(self):
    super(TestGetAttributes, self).setUp()
    self.clear_data()
    self.client.get("/login")

  @ddt.data(
      (u"Война", "Risk"),
      (u"戰爭", "Program"),
      (u"Krieg".encode("ascii"), "Audit"),
  )
  @ddt.unpack
  def test_get_attributes(self, role_name, object_type):
    """Test get all attributes json"""
    factories.AccessControlRoleFactory(
        name=role_name,
        object_type=object_type
    )
    all_attrs_str = get_all_attributes_json(load_custom_attributes=True)
    all_attrs = json.loads(all_attrs_str)
    all_attrs_for_type = all_attrs[object_type]
    self.assertIn(role_name, (x["attr_name"] for x in all_attrs_for_type))

  def test_get_attributes_cads(self):
    """Test get attributes json with cads."""
    factories.CustomAttributeDefinitionFactory(
        title="cad text",
        definition_type="control",
        attribute_type="Text",
    )
    ext_cad = factories.ExternalCustomAttributeDefinitionFactory(
        title="ext cad text",
        definition_type="control",
        attribute_type="Text",
    )
    attrs_str = get_attributes_json()
    attrs_json = json.loads(attrs_str)
    self.assertEqual(len(attrs_json), 1)
    attr = attrs_json[0]
    self.assertEqual(attr["external_id"], ext_cad.external_id)
    self.assertEqual(attr["title"], ext_cad.title)
    self.assertEqual(attr["definition_type"], ext_cad.definition_type)
    self.assertEqual(attr["attribute_type"], ext_cad.attribute_type)

  def test_get_all_attributes_cads(self):
    """Test get all attributes json with cads."""
    cad = factories.CustomAttributeDefinitionFactory(
        title="cad text",
        definition_type="control",
        attribute_type="Text",
    )
    ext_cad = factories.ExternalCustomAttributeDefinitionFactory(
        title="ext cad text",
        definition_type="control",
        attribute_type="Text",
    )
    attrs_str = get_all_attributes_json(load_custom_attributes=True)
    attrs_json = json.loads(attrs_str)
    attrs_by_type = attrs_json["Control"]
    attrs = (attr["attr_name"] for attr in attrs_by_type)
    self.assertIn(ext_cad.title, attrs)
    self.assertNotIn(cad.title, attrs)
