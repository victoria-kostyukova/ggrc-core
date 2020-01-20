# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests single event creation during start_recurring_cycles job execution."""

import mock

from freezegun import freeze_time

from ggrc import models
from ggrc.utils import user_generator
from ggrc_workflows import start_recurring_cycles, models as wf_models
from integration.ggrc import TestCase
from integration.ggrc_workflows import WorkflowsGenerator


class TestRecurringCyclesEvent(TestCase):
  """Tests the number of events created after start_recurring_cycles is executed.

  Test suite for checking that only one event has been created
  in the database during start_recurring_cycles cron job execution.
  """
  def setUp(self):
    """Set up for single event creation test cases."""
    super(TestRecurringCyclesEvent, self).setUp()
    wf_generator = WorkflowsGenerator()

    wf_data = {
        'unit': 'week',
        'repeat_every': 1
    }

    tg_data = {
        'start_date': '2018-01-17',
        'end_date': '2018-01-17'
    }

    with freeze_time('2018-01-17'):
      _, workflow_1 = wf_generator.generate_workflow(data=wf_data)
      _, task_group_1 = wf_generator.generate_task_group(workflow=workflow_1)
      wf_generator.generate_task_group_task(task_group=task_group_1,
                                            data=tg_data)
      wf_generator.activate_workflow(workflow_1)

      _, workflow_2 = wf_generator.generate_workflow(data=wf_data)
      _, task_group_2 = wf_generator.generate_task_group(workflow=workflow_2)
      wf_generator.generate_task_group_task(task_group=task_group_2,
                                            data=tg_data)
      wf_generator.activate_workflow(workflow_2)

    self.cycles_count = wf_models.Cycle.query.count()

  def test_event_creation(self):
    """Test single event creation.

    Cycles will be create every every 1 week (see setUp)
    """
    with freeze_time('2018-01-24'):
      from ggrc.login import noop
      noop.login()
      start_recurring_cycles()

    events = models.Event.query.filter(models.Event.action == 'BULK').all()
    new_cycles_count = wf_models.Cycle.query.count()

    self.assertEqual(new_cycles_count, self.cycles_count + 2)
    self.assertEqual(len(events), 1)
    self.assertEqual(len(events[0].revisions), 28)

  def test_event_is_not_created(self):
    """Test no event created.

    Cycles won't be create on the next day of workflow creation
    Cycles will be create every every 1 week (see setUp)
    """
    revisions_count = models.Revision.query.count()
    with freeze_time('2018-01-18'):
      start_recurring_cycles()

    events = models.Event.query.filter(models.Event.action == 'BULK').all()
    new_cycles_count = wf_models.Cycle.query.count()
    new_revisions_count = models.Revision.query.count()

    self.assertEqual(new_cycles_count, self.cycles_count)
    self.assertEqual(len(events), 0)
    self.assertEqual(new_revisions_count, revisions_count)

  def test_event_created_by_migrator(self):
    """Test no error occurred and event created with migrator user"""

    with freeze_time('2018-01-24'):
      with mock.patch("ggrc.login.get_current_user_id", return_value=None):
        start_recurring_cycles()

    events = models.Event.query.filter(models.Event.action == 'BULK').all()
    new_cycles_count = wf_models.Cycle.query.count()

    self.assertEqual(new_cycles_count, self.cycles_count + 2)
    self.assertEqual(len(events), 1)
    self.assertEqual(
        events[0].modified_by_id,
        user_generator.get_migrator_id()
    )
    self.assertEqual(len(events[0].revisions), 28)
