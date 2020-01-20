# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests builder of calendar events."""

from datetime import date, datetime
import mock
from freezegun import freeze_time

from ggrc.models import all_models
from ggrc.gcalendar import common
from integration.ggrc.gcalendar import BaseCalendarEventTest


@mock.patch("ggrc.gcalendar.calendar_api_service"
            ".CalendarApiService.calendar_auth")
class TestSendCalendarEvents(BaseCalendarEventTest):
  """Test calendar events builder class."""

  def setUp(self):
    """Set up test."""
    super(TestSendCalendarEvents, self).setUp()
    self.client.get("/login")

  def test_rebuild_existing_event(self, _):
    """Test rebuild of existing synced Calendar Event."""
    person, task, event = self.setup_person_task_event(date(2015, 1, 5))
    event.last_synced_at = datetime(2015, 1, 5, 12, 0, 0)
    with freeze_time("2015-01-01 12:00:00"):
      common.send_calendar_events()
    event = self.get_event(person.id, task.end_date)
    self.assertIsNotNone(event)
    self.assertIsNotNone(self.get_relationship(task.id, event.id))

  def test_event_change_date(self, _):
    """Test rebuild calendar event with changed date."""
    person, task, event = self.setup_person_task_event(date(2015, 1, 5))
    event.last_synced_at = datetime(2015, 1, 5, 12, 0, 0)
    event.external_event_id = "abc"
    task.end_date = date(2015, 1, 6)
    with freeze_time("2015-01-01 12:00:00"):
      common.send_calendar_events()
    self.assertEquals(all_models.CalendarEvent.query.count(), 1)
    event = self.get_event(person.id, task.end_date)
    self.assertIsNotNone(event)
    self.assertIsNotNone(self.get_relationship(task.id, event.id))

  def test_create_event_without_send(self, _):
    """Test creation of event."""
    person, task, event = self.setup_person_task_event(date(2015, 1, 5))
    person.profile.send_calendar_events = False
    with freeze_time("2015-01-1 12:00:00"):
      common.send_calendar_events()
    event = self.get_event(person.id, task.end_date)
    self.assertEquals(event.needs_sync, False)
    self.assertIsNone(event.last_synced_at)
