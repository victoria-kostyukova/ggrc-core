# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test bulk issuetracker synchronization."""

import mock

from integration.ggrc import TestCase
from ggrc.integrations import issuetracker_bulk_sync


class TestBulkIssuesGenerate(TestCase):
  """Test bulk issues generation."""
  def setUp(self):
    self.creator = issuetracker_bulk_sync.IssueTrackerBulkCreator()

  def test_not_update_empty_errors(self):
    """Test if there are no errors we don't try to update DB"""
    with mock.patch.object(issuetracker_bulk_sync.IssueTrackerBulkCreator,
                           "_create_failed_items_list") as list_mock:
      # pylint: disable=protected-access
      self.creator._update_failed_items([])
    list_mock.assert_not_called()
