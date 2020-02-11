# Copyright (C) 2019 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test Issue tracker params container."""

# pylint: disable=protected-access
# pylint: disable=invalid-name

import unittest

import ddt

from ggrc.models import exceptions
from ggrc.models.hooks.issue_tracker import issue_tracker_params_container


@ddt.ddt
class TestIssueTrackerParamsContainer(unittest.TestCase):
  """Test class for containing Issue Tracker params."""

  def setUp(self):
    """Perform initialisation for each test cases."""
    self.params = issue_tracker_params_container.IssueTrackerParamsContainer()

  def fill_params_container_with_data(self):
    """Fill all container fields with test data."""
    self.params.enabled = True
    self.params.title = "Test title"
    self.params.issue_type = "Test type"
    self.params.status = "Test status"
    self.params.verifier = "verifier@email.com"
    self.params.assignee = "assignee@email.com"
    self.params.reporter = "reporter@email.com"
    self.params.cc_list = ["secondary@email.com", ]
    self.params.component_id = 188208
    self.params.hotlist_id = 4321
    self.params.issue_priority = "P2"
    self.params.issue_severity = "S2"

    self.params.add_comment("Test_comment")

  def test_component_id_property(self):
    """Test 'component_id' property."""
    test_component_id = 188208
    self.params.component_id = test_component_id
    self.assertEquals(self.params._component_id, test_component_id)

  def test_component_id_property_for_failure(self):
    """Test 'component_id' property for raising ValidationError."""
    test_component_id = "Invalid component ID"
    with self.assertRaises(exceptions.ValidationError):
      self.params.component_id = test_component_id

  def test_hotlist_id_property(self):
    """Test 'hotlist_id' property."""
    test_hotlist_id = 1234
    self.params.hotlist_id = test_hotlist_id
    self.assertEquals(self.params._hotlist_id, test_hotlist_id)

  def test_hotlist_id_property_for_failure(self):
    """Test 'hotlist_id' property for raising ValidationError."""
    test_hotlist_id = "Invalid hotlist ID"
    with self.assertRaises(exceptions.ValidationError):
      self.params.hotlist_id = test_hotlist_id

  @ddt.data("P0", "P1", "P2", "P3", "P4", )
  def test_priority_property(self, test_priority):
    """Test 'priority' property."""
    self.params.issue_priority = test_priority
    self.assertEquals(self.params._issue_priority, test_priority)

  def test_priority_property_for_faileure(self):
    """Test 'priority' property for raising ValidationError."""
    test_priority = "Invalid priority"
    with self.assertRaises(exceptions.ValidationError):
      self.params.issue_priority = test_priority

  @ddt.data("S0", "S1", "S2", "S3", "S4",)
  def test_severity_property(self, test_severity):
    """Test 'severity' property."""
    self.params.issue_severity = test_severity
    self.assertEquals(self.params._issue_severity, test_severity)

  def test_severity_property_for_faileure(self):
    """Test 'severity' property for raising ValidationError."""
    test_severity = "Invalid severity"
    with self.assertRaises(exceptions.ValidationError):
      self.params.issue_severity = test_severity

  def test_comment_property(self):
    """Test 'comment' property."""
    self.assertIsNone(self.params.comment)

    test_comment_1 = "test_comment_1"
    test_comment_2 = "test_comment_2"
    expected_result = "test_comment_1\n\ntest_comment_2"

    self.params.add_comment(test_comment_1)
    self.params.add_comment(test_comment_2)

    self.assertEquals(self.params.comment, expected_result)

  def test_is_empty(self):
    """Test 'is_empty' method."""
    self.assertTrue(self.params.is_empty())

    self.params.title = "Test title"
    self.assertFalse(self.params.is_empty())

  def test_get_issue_tracker_params(self):
    """Test 'get_issue_tracker_params' method."""
    expected_result = {
        "assignee": "assignee@email.com",
        "ccs": ["secondary@email.com", ],
        "comment": "Test_comment",
        "component_id": 188208,
        "hotlist_ids": [4321, ],
        "priority": "P2",
        "reporter": "reporter@email.com",
        "severity": "S2",
        "status": "Test status",
        "title": "Test title",
        "type": "Test type",
        "verifier": "verifier@email.com"
    }
    self.fill_params_container_with_data()
    issue_tracker_params = self.params.get_issue_tracker_params()
    self.assertDictEqual(issue_tracker_params, expected_result)

  def test_get_params_for_ggrc_object(self):
    """Test 'get_params_for_ggrc_object' method."""
    expected_result = {
        "assignee": "assignee@email.com",
        "cc_list": ["secondary@email.com", ],
        "component_id": 188208,
        "hotlist_id": 4321,
        "enabled": True,
        "issue_priority": "P2",
        "issue_severity": "S2",
        "status": "Test status",
        "title": "Test title",
        "issue_type": "Test type"
    }
    self.fill_params_container_with_data()
    issue_tracker_params = self.params.get_params_for_ggrc_object()
    self.assertDictEqual(issue_tracker_params, expected_result)
