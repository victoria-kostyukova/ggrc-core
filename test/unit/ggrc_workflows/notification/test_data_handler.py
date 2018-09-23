# -*- coding: utf-8 -*-

# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""A module with tests for the GGRC Workflow's data_handler module."""

import unittest
from mock import patch

from ggrc_workflows import models
from ggrc_workflows.notification import data_handler


class GetCycleTaskUrlTestCase(unittest.TestCase):
  """Tests for the get_cycle_task_url() function."""

  # pylint: disable=invalid-name, unused-argument
  @patch(
      u"ggrc_workflows.notification.data_handler.get_url_root",
      return_value=u"http://www.foo.com/")
  def test_generates_correct_url_for_task(self, *mocks):
    """The method should return a correct URL for the given Task."""
    result = data_handler.get_cycle_task_url()

    expected_url = u"http://www.foo.com/dashboard#!task"
    self.assertEqual(result, expected_url)


@patch(u"ggrc_workflows.models.cycle.get_url_root",
       return_value=u"http://www.foo.com/")
@patch(u"ggrc.access_control.role.get_ac_roles_for", return_value={})
class GetCycleUrlTestCase(unittest.TestCase):
  """Tests for the get_cycle_url() function."""

  # pylint: disable=invalid-name, unused-argument

  def test_generates_correct_url_for_active_cycle(self, *mocks):
    """The method should return correct URL for active Cycles."""
    workflow = models.Workflow(id=111)
    cycle = models.Cycle(id=22, workflow=workflow)

    # by default, a cycle is considered active
    expected_url = (
        u"http://www.foo.com/"
        u"workflows/111#current"
        u"/cycle/22"
    )
    self.assertEqual(expected_url, cycle.cycle_url)

  def test_generates_correct_url_for_inactive_cycle(self, *mocks):
    """The method should return correct URL for inactive Cycles."""
    workflow = models.Workflow(id=111)
    cycle = models.Cycle(id=22, workflow=workflow)

    expected_url = (
        u"http://www.foo.com/"
        u"workflows/111#history"
        u"/cycle/22"
    )
    self.assertEqual(expected_url, cycle.cycle_inactive_url)
