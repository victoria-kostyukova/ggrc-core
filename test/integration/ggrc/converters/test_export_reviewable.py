# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests export reviewable."""
from integration.ggrc import TestCase

from integration.ggrc.models import factories


class TestExportReviewable(TestCase):
  """Reviewable export tests."""

  def setUp(self):
    """Set up for Reviewable test cases."""
    super(TestExportReviewable, self).setUp()
    self.client.get("/login")

  def test_simple_export(self):
    """Reviewable should contain Review State in exported csv"""
    factories.ControlFactory(title="Test control")
    data = [
        {
            "object_name": "Control",
            "filters": {
                "expression": {}
            },
            "fields": "all"
        }
    ]
    response = self.export_csv(data)

    self.assertIn("Test control", response.data)
    self.assertIn("Review State", response.data)
    self.assertIn("Unreviewed", response.data)

  def test_simple_export_not_reviewable(self):
    """NON Reviewable should NOT contain Review State in exported csv"""
    factories.AuditFactory(title="Test audit")
    data = [
        {
            "object_name": "Audit",
            "filters": {
                "expression": {}
            },
            "fields": "all"
        }
    ]
    response = self.export_csv(data)

    self.assertIn("Test audit", response.data)
    self.assertNotIn("Review State", response.data)
    self.assertNotIn("Unreviewed", response.data)
