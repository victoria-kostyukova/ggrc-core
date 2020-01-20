# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests generation csv template for audits."""

from integration.ggrc import TestCase


class TestAuditCSVTemplate(TestCase):
  """Tests generation csv template for audits."""

  def setUp(self):
    """Set up for test cases."""
    super(TestAuditCSVTemplate, self).setUp()
    self.client.get("/login")

  def test_exclude_evidence_file(self):
    """Test exclude evidence file field from csv template"""
    objects = [{"object_name": "Audit"}]
    response = self.export_csv_template(objects)
    self.assertNotIn("Evidence File", response.data)
