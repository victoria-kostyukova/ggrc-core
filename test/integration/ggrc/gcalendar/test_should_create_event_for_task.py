# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test should_create_event_for method."""

from datetime import date
import ddt
from freezegun import freeze_time

from ggrc.models import all_models
from ggrc.gcalendar import calendar_event_builder
from integration.ggrc import TestCase
from integration.ggrc.models import factories
from integration.ggrc_workflows.models import factories as wf_factories


# pylint: disable=protected-access
@ddt.ddt
class TestShouldCreateEventForTask(TestCase):
  """Tests for _should_create_event_for method."""

  def setUp(self):
    """Set up test."""
    super(TestShouldCreateEventForTask, self).setUp()
    self.client.get("/login")
    self.builder = calendar_event_builder.CalendarEventBuilder()

  @ddt.data((u"Deprecated", False, False),
            (u"In Progress", False, True),
            (u"Assigned", False, True),
            (u"Finished", False, False),

            (u"Declined", True, True),
            (u"Verified", True, False),
            (u"Deprecated", True, False),
            (u"In Progress", True, True),
            (u"Finished", True, True),
            (u"Assigned", True, True))
  @ddt.unpack
  def test_task_status(
      self, task_status, is_verification_needed, should_create_event
  ):
    """Task {}, is verification needed {}, should event be created {}."""
    with factories.single_commit():
      cycle = wf_factories.CycleFactory(
          is_verification_needed=is_verification_needed,
      )
      task = wf_factories.CycleTaskGroupObjectTaskFactory(
          status=task_status,
          end_date=date(2015, 1, 5),
          cycle=cycle,
      )
    with freeze_time("2015-01-1 12:00:00"):
      self.assertEquals(self.builder._should_create_event_for(task),
                        should_create_event)

  def test_overdue_task(self):
    """Check that the event should not be created overdue tasks."""
    task = wf_factories.CycleTaskGroupObjectTaskFactory(
        status=u"In Progress",
        end_date=date(2015, 1, 1),
    )
    with freeze_time("2015-01-05 12:00:00"):
      self.assertEquals(self.builder._should_create_event_for(task), False)

  def test_is_in_history_task(self):
    """Check that the event should not be created is_in_history tasks."""
    with factories.single_commit():
      cycle = wf_factories.CycleFactory(is_current=False)
      task = wf_factories.CycleTaskGroupObjectTaskFactory(
          status=u"In Progress",
          end_date=date(2015, 1, 5),
          cycle=cycle,
      )
    with freeze_time("2015-01-01 12:00:00"):
      self.assertEquals(self.builder._should_create_event_for(task), False)

  @ddt.data((False, False), (True, True))
  @ddt.unpack
  def test_task_archived(self, recurrence, should_create_event):
    """Check creation of event based on workflow archived states."""
    with factories.single_commit():
      workflow = wf_factories.WorkflowFactory(
          unit=all_models.Workflow.WEEK_UNIT,
          recurrences=recurrence,
          next_cycle_start_date=date(2015, 1, 5),
      )
      cycle = wf_factories.CycleFactory(workflow=workflow)
      task = wf_factories.CycleTaskGroupObjectTaskFactory(
          status=u"In Progress",
          end_date=date(2015, 1, 5),
          cycle=cycle,
      )
    with freeze_time("2015-01-01 12:00:00"):
      self.assertEquals(self.builder._should_create_event_for(task),
                        should_create_event)
