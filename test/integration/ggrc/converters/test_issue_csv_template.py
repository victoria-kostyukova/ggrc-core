# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests generation csv template for issues."""

from integration.ggrc import TestCase


class TestIssueCSVTemplate(TestCase):
  """Tests generation csv template for issues."""

  def setUp(self):
    """Set up for test cases."""
    super(TestIssueCSVTemplate, self).setUp()
    self.client.get("/login")

  def test_read_only_help_text(self):
    """Test help text for read only fields in import template"""
    help_text = "Read only column and will be ignored on import."
    objects = [{"object_name": "Issue"}]
    response = self.export_csv_template(objects)
    self.assertIn(help_text, response.data)
    snapshots_count = response.data.count("version")
    # Also read only fields are: "map:assessment", "map:audit",
    # "unmap:assessment", "unmap:audit"
    expected_help_text_count = snapshots_count + 4
    help_text_count = response.data.count(help_text)
    self.assertEquals(help_text_count, expected_help_text_count)
