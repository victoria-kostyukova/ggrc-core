# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Integration tests for IssueTracker updates via import cases."""


import mock

from ggrc import settings
from ggrc.models.hooks.issue_tracker import assessment_integration

from integration import ggrc
from integration.ggrc.api_helper import Api


class TestIssueTrackedImport(ggrc.TestCase):
  """Test cases for IssueTracker integration via import."""

  def setUp(self):
    # pylint: disable=super-on-old-class
    super(TestIssueTrackedImport, self).setUp()
    self.api = Api()
    self.client.get("/login")

  @mock.patch('ggrc.integrations.issues.Client.create_issue')
  def test_asmt_creation_detached(self, mock_create_issue):
    """Test assessment creation via import detached from IssueTracker hooks."""
    with mock.patch.object(assessment_integration, '_is_issue_tracker_enabled',
                           return_value=True):
      self.import_file("assessment_full_no_warnings.csv")
    mock_create_issue.assert_not_called()

  @mock.patch('ggrc.integrations.issues.Client.create_issue')
  @mock.patch.object(settings, "ISSUE_TRACKER_ENABLED", True)
  def test_issue_creation_detached(self, mock_create_issue):
    """Test issue creation via import detached from IssueTracker hooks."""
    self.import_file("issue_for_import.csv")
    mock_create_issue.assert_not_called()
