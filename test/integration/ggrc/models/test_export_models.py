# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Tests export functionality."""
from integration.ggrc import generator
from integration.ggrc import TestCase
from integration.ggrc.models import factories


class TestBasicExport(TestCase):
  """Test basic class for checking export."""

  def setUp(self):
    super(TestBasicExport, self).setUp()
    self.client.get("/login")
    self.generator = generator.ObjectGenerator()

  def test_export_folder(self):
    """Test checks folder attr export."""
    folder_id = "1WXB8oulc68ZWdFhX96Tv1PBLi8iwALR3"
    attr_name = "GDrive Folder ID"
    factories.AuditFactory(folder=folder_id)

    data = [{
        "object_name": "Audit",
        "filters": {
            "expression": {}
        },
        "fields": "all"
    }]
    response = self.export_parsed_csv(data)["Audit"][0]
    self.assertTrue(attr_name in response)
    self.assertTrue(response[attr_name] == folder_id)
