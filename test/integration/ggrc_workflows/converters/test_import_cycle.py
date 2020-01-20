# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Tests for Cycle import."""

import datetime
from collections import OrderedDict

import ddt

from ggrc.converters import errors
from ggrc.models import all_models

from integration.ggrc.models import factories
from integration.ggrc_workflows.generator import WorkflowsGenerator
from integration.ggrc_workflows.helpers.workflow_test_case \
    import WorkflowTestCase
from integration.ggrc_workflows.models import factories as wf_factories


@ddt.ddt
class TestCycleImport(WorkflowTestCase):
  """Tests for Cycle model import"""

  def setUp(self):
    super(TestCycleImport, self).setUp()
    self.generator = WorkflowsGenerator()

  @ddt.data(
      ("valid_user@example.com", []),
      ("user2@example.com\nvalid_user@example.com",
       [errors.MULTIPLE_ASSIGNEES.format(line=3, column_name="Assignee")]),
  )
  @ddt.unpack
  def test_assignee_updated(self, assignee, expected_warnings):
    """Tests updating cycle assignee via import"""
    with factories.single_commit():
      factories.PersonFactory(email="valid_user@example.com")
      workflow = wf_factories.WorkflowFactory()
      group = wf_factories.TaskGroupFactory(workflow=workflow)
      wf_factories.TaskGroupTaskFactory(
          task_group=group,
          start_date=datetime.date(2017, 2, 28),
          end_date=datetime.date(2017, 2, 28) + datetime.timedelta(days=4)
      )
    _, cycle = self.generator.generate_cycle(workflow)
    data = OrderedDict([
        ("object_type", "Cycle"),
        ("code", cycle.slug),
        ("title", cycle.title),
        ("Assignee", assignee),
    ])

    response = self.import_data(data)
    expected_messages = {
        "Cycle": {
            "row_warnings": set(expected_warnings),
        },
    }
    self._check_csv_response(response, expected_messages)
    cycle = all_models.Cycle.query.one()
    self.assertEqual(cycle.contact.email, "valid_user@example.com")

  @ddt.data(
      ("", []),
      ("user2@example.com\nuser3@example.com",
       [
           errors.MULTIPLE_ASSIGNEES.format(line=3, column_name="Assignee"),
           errors.UNKNOWN_USER_WARNING.format(line=3,
                                              email="user2@example.com"),
           errors.UNKNOWN_USER_WARNING.format(line=3,
                                              email="user3@example.com")
       ]),
  )
  @ddt.unpack
  def test_assignee_not_updated(self, assignee, expected_warnings):
    """Tests cycle assignee wasn't updated with wrong user"""
    with factories.single_commit():
      workflow = wf_factories.WorkflowFactory()
      group = wf_factories.TaskGroupFactory(workflow=workflow)
      wf_factories.TaskGroupTaskFactory(
          task_group=group,
          start_date=datetime.date(2017, 2, 28),
          end_date=datetime.date(2017, 2, 28) + datetime.timedelta(days=4)
      )
    _, cycle = self.generator.generate_cycle(workflow)
    data = OrderedDict([
        ("object_type", "Cycle"),
        ("code", cycle.slug),
        ("title", cycle.title),
        ("Assignee", assignee),
    ])

    response = self.import_data(data)
    expected_messages = {
        "Cycle": {
            "row_warnings": set(expected_warnings),
        },
    }
    self._check_csv_response(response, expected_messages)
    cycle = all_models.Cycle.query.one()
    self.assertFalse(cycle.contact)
