# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

# pylint: disable=maybe-no-member, invalid-name

"""Test Issue export."""
import datetime

from integration.ggrc.models import factories
from integration.ggrc import TestCase


class TestExportIssues(TestCase):
  """Basic Issue export tests."""

  def setUp(self):
    super(TestExportIssues, self).setUp()
    self.client.get("/login")

  def test_issue_due_date_export(self):
    """Test issue due date export."""
    factories.IssueFactory(due_date=datetime.date(2018, 6, 14))
    data = [{
        "object_name": "Issue",
        "filters": {
            "expression": {}
        },
        "fields": "all"
    }]
    response = self.export_csv(data)
    self.assertIn("06/14/2018", response.data)
