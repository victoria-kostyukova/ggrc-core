# -*- coding: utf-8 -*-

# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""A module with tests for the GGRC Workflow's data_handler module."""

import unittest
from mock import patch

from ggrc.gcalendar.utils import get_cycle_tasks_url_by_slug
from ggrc_workflows import models
from ggrc_workflows.notification import data_handler


class GetCycleTaskUrlTestCase(unittest.TestCase):
  """Tests for the get_cycle_tasks_url_by_slug() function."""

  @patch(u"ggrc.gcalendar.utils.get_url_root",
         return_value=u"http://www.foo.com/")
  def test_correct_url_for_task(self, *_):
    """The method should return a correct URL for the given Task."""
    result = get_cycle_tasks_url_by_slug("CYCLETASK-1")
    expected_url = (u"http://www.foo.com/dashboard#!task"
                    u"&query=%22task%20slug%22%3DCYCLETASK-1")
    self.assertEqual(result, expected_url)


@patch(u"ggrc_workflows.models.cycle.get_url_root",
       return_value=u"http://www.foo.com/")
@patch(u"ggrc.access_control.role.get_ac_roles_for", return_value={})
class GetCycleUrlTestCase(unittest.TestCase):
  """Tests for the get_cycle_url() function."""

  def test_url_for_active_cycle(self, *_):
    """The method should return correct URL for active Cycles."""
    workflow = models.Workflow(id=111)
    cycle = models.Cycle(slug="CYCLE-22", workflow=workflow)

    # by default, a cycle is considered active
    expected_url = (
        u"http://www.foo.com/"
        u"workflows/111#current"
        u"&query=%22cycle%20slug%22%3D%22CYCLE-22%22"
    )
    self.assertEqual(expected_url, cycle.cycle_url)

  def test_url_for_inactive_cycle(self, *_):
    """The method should return correct URL for inactive Cycles."""
    workflow = models.Workflow(id=111)
    cycle = models.Cycle(slug="CYCLE-22", workflow=workflow)

    expected_url = (
        u"http://www.foo.com/"
        u"workflows/111#history"
        u"&query=%22cycle%20slug%22%3D%22CYCLE-22%22"
    )
    self.assertEqual(expected_url, cycle.cycle_inactive_url)


@patch(u"ggrc_workflows.notification.data_handler.get_url_root",
       return_value=u"http://www.foo.com/")
@patch(u"ggrc.access_control.role.get_ac_roles_for", return_value={})
class GetWorkflowUrlTestCase(unittest.TestCase):
  """Tests for the get_workflow_url() function."""

  def test_correct_url_for_workflow(self, *_):
    """The method should return correct URL for Workflow."""
    workflow = models.Workflow(id=111)
    expected_url = u"http://www.foo.com/workflows/111#current"
    self.assertEqual(expected_url, data_handler.get_workflow_url(workflow))
