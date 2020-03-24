# Copyright (C) 2019 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test Ticket Tracker attribute export for assessment."""

import ddt

from mock import patch

from ggrc import db
from ggrc import models
from ggrc import settings
from ggrc.models.hooks.issue_tracker import assessment_integration

from integration.ggrc import TestCase
from integration.ggrc import api_helper
from integration.ggrc.models import factories


@ddt.ddt
class TestTicketTrackerExport(TestCase):
  """Test Ticket Tracker attribute export for assessment."""

  def setUp(self):
    super(TestTicketTrackerExport, self).setUp()
    self.client.get("/login")
    self.api = api_helper.Api()

  @patch('ggrc.integrations.issues.Client.update_issue')
  @patch.object(settings, "ISSUE_TRACKER_ENABLED", True)
  def test_assessment_export(self, _):
    """Test export Assessment Ticket Tracker attribute(link to issue)."""
    with patch.object(
        assessment_integration.AssessmentTrackerHandler,
        '_is_tracker_enabled',
        return_value=True
    ):
      iti = factories.IssueTrackerIssueFactory()
      asmt = iti.issue_tracked_obj
      asmt_id = asmt.id
      audit = asmt.audit
      self.api.modify_object(audit, {
          "issue_tracker": {
              "enabled": True,
              "component_id": "188208",
              "hotlist_id": "222222",
              "issue_type": "PROCESS",
              "issue_priority": "P2",
              "issue_severity": "S2"
          },
      })
      asmt = db.session.query(models.Assessment).get(asmt_id)
      self.api.modify_object(asmt, {
          "issue_tracker": {
              "enabled": True,
              "component_id": "188208",
              "hotlist_id": "222222",
              "issue_type": "PROCESS",
              "issue_priority": "P2",
              "issue_severity": "S2"
          },
      })
      asmt = db.session.query(models.Assessment).get(asmt_id)
      self.api.modify_object(asmt, {
          "issue_tracker": {
              "enabled": True,
              "component_id": "188208",
              "hotlist_id": "222222",
              "issue_type": "PROCESS",
              "issue_priority": "P2",
              "issue_severity": "S2",
              "title": "Title Here",
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
  def test_issue_export_link(self, update_mock):
    """Export Issue Ticket Tracker attribute (link to ticket)."""
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

  @ddt.data("Issue", "Assessment")
  def test_issue_export(self, model_name):
    """Test export for issuetracked attributes.

    Attribute list: component_id, hotlist_id, issue_type,
    issue_priority, issue_severity"""
    factory = factories.get_model_factory(model_name)
    with factories.single_commit():
      factories.IssueTrackerIssueFactory(
          issue_tracked_obj=factory(),
          component_id="188208",
          hotlist_id=54321,
          issue_type="PROCESS",
          issue_severity="S4",
          issue_priority="P4",
          enabled=True
      )
    data = [{"object_name": model_name,
             "fields": "all",
             "filters": {"expression": {}}}]

    response = self.export_csv(data)
    self.assertEqual(response.status_code, 200)

    self.assertIn("Component ID", response.data)
    self.assertIn("188208", response.data)
    self.assertIn("Hotlist ID", response.data)
    self.assertIn("54321", response.data)
    self.assertIn("Issue Type", response.data)
    self.assertIn("PROCESS", response.data)
    self.assertIn("Priority", response.data)
    self.assertIn("P4", response.data)
    self.assertIn("Severity", response.data)
    self.assertIn("S4", response.data)
    self.assertIn("on", response.data)

  @ddt.data("Issue", "Assessment")
  def test_issue_title_export(self, model_name):
    """Test export for issuetracked title attribute."""
    factory = factories.get_model_factory(model_name)
    with factories.single_commit():
      factories.IssueTrackerIssueFactory(
          issue_tracked_obj=factory(),
          title="tickettitle",
      )
    data = [{"object_name": model_name,
             "fields": "all",
             "filters": {"expression": {}}}]

    response = self.export_csv(data)
    self.assertEqual(response.status_code, 200)

    self.assertIn("Ticket Title", response.data)
    self.assertIn("tickettitle", response.data)
