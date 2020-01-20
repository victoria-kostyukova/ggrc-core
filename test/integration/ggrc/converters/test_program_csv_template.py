# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests generation csv template for programs."""

from integration.ggrc import TestCase


class TestProgramCSVTemplate(TestCase):
  """Tests generation csv template for programs."""

  def setUp(self):
    """Set up for test cases."""
    super(TestProgramCSVTemplate, self).setUp()
    self.client.get("/login")

  def test_exclude_map_program(self):
    """Test exclude map:program field from csv template"""
    objects = [{"object_name": "Program"}]
    response = self.export_csv_template(objects)
    self.assertNotIn("map:program", response.data)
