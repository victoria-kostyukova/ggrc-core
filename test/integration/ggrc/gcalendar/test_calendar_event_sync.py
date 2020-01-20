# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests sync of calendar events."""

from datetime import date
from freezegun import freeze_time
import mock

from ggrc import db
from ggrc.gcalendar import calendar_event_sync
from ggrc_workflows.models import CycleTaskGroupObjectTask
from integration.ggrc.models import factories
from integration.ggrc.gcalendar import BaseCalendarEventTest


# pylint: disable=protected-access
class TestCalendarEventSync(BaseCalendarEventTest):
  """Test calendar event sync."""

  def setUp(self):
    """Set up test with mocks."""
    super(TestCalendarEventSync, self).setUp()
    self.client.get("/login")
    with mock.patch("ggrc.gcalendar.calendar_api_service"
                    ".CalendarApiService.calendar_auth"):
      self.sync = calendar_event_sync.CalendarEventsSync()

  @mock.patch("ggrc.gcalendar.calendar_api_service"
              ".CalendarApiService.create_event",
              return_value={
                  "content": {
                      "id": "external_event_id"
                  },
                  "status_code": 200,
              })
  def test_create_event(self, create_event_mock):
    """Test creation of event."""
    person, _, event = self.setup_person_task_event(date(2015, 1, 15))
    with freeze_time("2015-01-1 12:00:00"):
      self.sync._create_event(event)
    create_event_mock.assert_called_with(
        event_id=event.id,
        calendar_id="primary",
        summary=event.title,
        description=event.description,
        start="2015-01-15",
        end="2015-01-16",
        timezone="UTC",
        attendees=[person.email],
        send_notifications=False
    )
    self.assertEquals(event.external_event_id, "external_event_id")
    self.assertEquals(event.last_synced_at.date(), date(2015, 1, 1))

  @mock.patch("ggrc.gcalendar.calendar_api_service"
              ".CalendarApiService.create_event",
              return_value={
                  "content": {
                      "id": "external_event_id"
                  },
                  "status_code": 403,
              })
  def test_create_event_error(self, create_event_mock):
    """Test creation of event."""
    person, _, event = self.setup_person_task_event(date(2015, 1, 15))
    with freeze_time("2015-01-1 12:00:00"):
      self.sync._create_event(event)
    create_event_mock.assert_called_with(
        event_id=event.id,
        calendar_id="primary",
        summary=event.title,
        description=event.description,
        start="2015-01-15",
        end="2015-01-16",
        timezone="UTC",
        attendees=[person.email],
        send_notifications=False
    )
    self.assertIsNone(event.external_event_id)
    self.assertIsNone(event.last_synced_at)

  @mock.patch("ggrc.gcalendar.calendar_api_service"
              ".CalendarApiService.get_event",
              return_value={
                  "content": {
                      "description": "old description",
                      "summary": "summary",
                      "eventId": "eventId",
                  },
                  "status_code": 200,
              })
  @mock.patch("ggrc.gcalendar.calendar_api_service"
              ".CalendarApiService.update_event",
              return_value={
                  "status_code": 200,
              })
  def test_update_event(self, update_event_mock, get_event_mock):
    """Test update of event."""
    with factories.single_commit():
      person = factories.PersonFactory()
      event = factories.CalendarEventFactory(
          due_date=date(2015, 1, 15),
          attendee_id=person.id,
          description="new description",
          title="summary",
          external_event_id="eventId"
      )
      event_id = event.id
    with freeze_time("2015-01-1 12:00:00"):
      self.sync._update_event(event)
    get_event_mock.assert_called_with(
        calendar_id="primary",
        external_event_id="eventId",
        event_id=event_id,
    )
    update_event_mock.assert_called_with(
        event_id=event_id,
        external_event_id="eventId",
        calendar_id="primary",
        description="new description",
        summary="summary",
        start="2015-01-15",
        end="2015-01-16",
        timezone="UTC",
        attendees=[person.email],
    )
    self.assertEquals(event.last_synced_at.date(), date(2015, 1, 1))

  @mock.patch("ggrc.gcalendar.calendar_api_service"
              ".CalendarApiService.get_event",
              return_value={
                  "content": {
                      "description": "old description",
                      "summary": "summary",
                      "eventId": "eventId",
                  },
                  "status_code": 404,
              })
  def test_delete_event_on_update(self, get_event_mock):
    """Test update of event."""
    with factories.single_commit():
      person = factories.PersonFactory()
      event = factories.CalendarEventFactory(
          due_date=date(2015, 1, 15),
          attendee_id=person.id,
          description="new description",
          title="summary",
          external_event_id="eventId"
      )
      event_id = event.id
    with freeze_time("2015-01-1 12:00:00"):
      self.sync._update_event(event)
      db.session.commit()
    get_event_mock.assert_called_with(
        calendar_id="primary",
        external_event_id="eventId",
        event_id=event_id,
    )
    db_event = self.get_event(person.id, event.due_date)
    self.assertIsNone(db_event)

  @mock.patch("ggrc.gcalendar.calendar_api_service"
              ".CalendarApiService.get_event",
              return_value={
                  "content": {
                      "description": "old description",
                      "summary": "summary",
                      "eventId": "eventId",
                  },
                  "status_code": 404,
              })
  @mock.patch("ggrc.gcalendar.calendar_api_service"
              ".CalendarApiService.delete_event")
  def test_delete_not_found_event(self, delete_event_mock, get_event_mock):
    """Test delete of unsynced event."""
    with factories.single_commit():
      person = factories.PersonFactory()
      event = factories.CalendarEventFactory(
          due_date=date(2015, 1, 15),
          attendee_id=person.id,
          description="description",
          title="summary"
      )
    with freeze_time("2015-01-1 12:00:00"):
      self.sync._delete_event(event)
      db.session.commit()
    self.assertEqual(get_event_mock.call_count, 1)
    db_event = self.get_event(person.id, event.due_date)
    self.assertIsNone(db_event)
    self.assertEqual(delete_event_mock.call_count, 0)

  @mock.patch("ggrc.gcalendar.calendar_api_service"
              ".CalendarApiService.delete_event")
  def test_delete_not_synced_event(self, delete_event_mock):
    """Test delete of unsynced event."""
    with factories.single_commit():
      person = factories.PersonFactory()
      event = factories.CalendarEventFactory(
          due_date=date(2015, 1, 15),
          attendee_id=person.id,
          description="description",
          title="summary"
      )
    with freeze_time("2015-01-1 12:00:00"):
      self.sync.sync_cycle_tasks_events()
    db_event = self.get_event(person.id, event.due_date)
    self.assertIsNone(db_event)
    self.assertEqual(delete_event_mock.call_count, 0)

  @mock.patch("ggrc.gcalendar.calendar_api_service"
              ".CalendarApiService.create_event",
              return_value={
                  "content": "Smth went wrong",
                  "status_code": 500,
              })
  def test_fail_to_sync_event(self, create_event_mock):
    """Test that sync job tried to sync the second event after a failure."""
    self.setup_person_task_event(date(2015, 1, 5))
    self.setup_person_task_event(date(2015, 1, 6))
    with freeze_time("2015-01-1 12:00:00"):
      self.sync.sync_cycle_tasks_events()
    self.assertEqual(create_event_mock.call_count, 2)

  @mock.patch("ggrc.gcalendar.calendar_api_service"
              ".CalendarApiService.create_event")
  def test_create_overdue_event(self, create_event_mock):
    """Test create of overdue event."""
    self.setup_person_task_event(date(2015, 1, 5))
    with freeze_time("2015-01-10 12:00:00"):
      self.sync.sync_cycle_tasks_events()
    self.assertEqual(create_event_mock.call_count, 1)

  @mock.patch("ggrc.gcalendar.calendar_api_service"
              ".CalendarApiService.create_event")
  @mock.patch("ggrc.gcalendar.calendar_api_service"
              ".CalendarApiService.update_event")
  def test_update_overdue_event(self, update_event_mock, _):
    """Test update of overdue event."""
    _, task, _ = self.setup_person_task_event(date(2015, 1, 5))
    with freeze_time("2015-01-10 12:00:00"):
      self.sync.sync_cycle_tasks_events()
    task.title = "New title"
    with freeze_time("2015-01-11 12:00:00"):
      self.sync.sync_cycle_tasks_events()
    self.assertEqual(update_event_mock.call_count, 0)

  @mock.patch("ggrc.gcalendar.calendar_api_service"
              ".CalendarApiService.create_event")
  @mock.patch("ggrc.gcalendar.calendar_api_service"
              ".CalendarApiService.delete_event")
  def test_delete_overdue_event(self, delete_event_mock, _):
    """Test delete of overdue event."""
    _, task, _ = self.setup_person_task_event(date(2015, 1, 5))
    with freeze_time("2015-01-10 12:00:00"):
      self.sync.sync_cycle_tasks_events()
    task.status = CycleTaskGroupObjectTask.FINISHED
    with freeze_time("2015-01-11 12:00:00"):
      self.sync.sync_cycle_tasks_events()
    self.assertEqual(delete_event_mock.call_count, 0)
