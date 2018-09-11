# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test Ticket Tracker attribute export for assessment."""

from mock import patch

from ggrc import db
from ggrc import models
from ggrc import settings

from integration.ggrc import TestCase
from integration.ggrc import api_helper
from integration.ggrc.models import factories


class TestTicketTrackerExport(TestCase):
  """Test Ticket Tracker attribute export for assessment."""

  def setUp(self):
    super(TestTicketTrackerExport, self).setUp()
    self.client.get("/login")
    self.api = api_helper.Api()

  @patch('ggrc.integrations.issues.Client.update_issue')
  def test_assessment_export(self, _):
    """Export of Ticket Tracker attribute of assessment. """
    with patch.object(models.hooks.issue_tracker.assessment_integration,
                      '_is_issue_tracker_enabled', return_value=True):
      iti = factories.IssueTrackerIssueFactory()
      asmt = iti.issue_tracked_obj
      asmt_id = asmt.id
      audit = asmt.audit
      self.api.modify_object(audit, {
          "issue_tracker": {
              "enabled": True,
              "component_id": "11111",
              "hotlist_id": "222222",
          },
      })
      asmt = db.session.query(models.Assessment).get(asmt_id)
      self.api.modify_object(asmt, {
          "issue_tracker": {
              "enabled": True,
              "component_id": "11111",
              "hotlist_id": "222222",
          },
      })
      asmt = db.session.query(models.Assessment).get(asmt_id)
      self.api.modify_object(asmt, {
          "issue_tracker": {
              "enabled": True,
              "component_id": "11111",
              "hotlist_id": "222222",
              "issue_id": iti.issue_id,
              "issue_url": "http://issue/333333"
          },
      })

      data = [{"object_name": "Assessment",
               "fields": "all",
               "filters": {"expression": {}}}]
      response = self.export_csv(data)
      self.assertEqual(response.status_code, 200)
      self.assertIn("Ticket Tracker", response.data)
      self.assertIn("http://issue/333333", response.data)

  # pylint: disable=unused-argument
  @patch('ggrc.integrations.issues.Client.update_issue')
  def test_issue_export(self, update_mock):
    """Export of Ticket Tracker attribute of Issue."""
    with patch.object(settings, "ISSUE_TRACKER_ENABLED", True):
      issue_url = "http://issue/1111"
      factories.IssueTrackerIssueFactory(
          enabled=True,
          issue_tracked_obj=factories.IssueFactory(),
          issue_url=issue_url
      )

      data = [{"object_name": "Issue",
               "fields": "all",
               "filters": {"expression": {}}}]

      response = self.export_csv(data)
      self.assertEqual(response.status_code, 200)
      self.assertIn("Ticket Tracker", response.data)
      self.assertIn(issue_url, response.data)
