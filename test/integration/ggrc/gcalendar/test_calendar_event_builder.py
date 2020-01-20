# -*- coding: utf-8 -*-
# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests builder of calendar events."""

from datetime import date
import urllib

import ddt
import mock
from freezegun import freeze_time

from ggrc import db
from ggrc.models import all_models
from ggrc.gcalendar import calendar_event_builder
from integration.ggrc.models import factories
from integration.ggrc.gcalendar import BaseCalendarEventTest
from integration.ggrc_workflows.models import factories as wf_factories


# pylint: disable=protected-access
# pylint: disable=invalid-name
@ddt.ddt
class TestCalendarEventBuilder(BaseCalendarEventTest):
  """Test calendar events builder class."""

  def setUp(self):
    """Set up test."""
    super(TestCalendarEventBuilder, self).setUp()
    self.client.get("/login")
    self.builder = calendar_event_builder.CalendarEventBuilder()

  def test_get_task_persons_ids_to_notify(self):
    """Test getting task persons ids that should be notified."""
    recipient_types = [u"Task Assignees", u"Task Secondary Assignees"]
    persons = [factories.PersonFactory(), factories.PersonFactory()]
    persons_ids = [person.id for person in persons]
    with factories.single_commit():
      task = wf_factories.CycleTaskGroupObjectTaskFactory(
          end_date=date(2018, 1, 1),
      )
      task.add_person_with_role_name(persons[0], recipient_types[0])
      task.add_person_with_role_name(persons[1], recipient_types[1])
    ids = self.builder._get_task_persons_ids_to_notify(task)
    self.assertEqual(ids, set(persons_ids))

  def test_generate_description_for_event(self):
    """Test generating description for Calendar Event."""
    with factories.single_commit():
      person = factories.PersonFactory()
      event = factories.CalendarEventFactory(
          due_date=date(2015, 1, 10),
          attendee_id=person.id,
      )
      first_task = wf_factories.CycleTaskGroupObjectTaskFactory(
          title=u"unicode ascii title",
          end_date=date(2015, 1, 10),
      )
      second_task = wf_factories.CycleTaskGroupObjectTaskFactory(
          title=u"Â тест",
          end_date=date(2015, 1, 10),
      )
      third_task = wf_factories.CycleTaskGroupObjectTaskFactory(
          title="some ordinary title",
          end_date=date(2015, 1, 10),
      )
      factories.RelationshipFactory(source=first_task, destination=event)
      factories.RelationshipFactory(source=event, destination=second_task)
      factories.RelationshipFactory(source=event, destination=third_task)
      task_ids = [first_task.id, second_task.id, third_task.id]
    self.builder._preload_data()
    self.builder._generate_description_for_event(event, task_ids)
    link_not_encoded = (
        u'(("Task Status" IN ("Finished","Declined") and '
        u'"Needs Verification"="Yes") '
        u'or ("Task Status" IN ("Assigned","In Progress"))'
        u') and "Task Due Date"=01/10/2015'
    )
    expected_description = (
        u"You have following tasks due today:\n"
        u"- Â тест\n"
        u"- some ordinary title\n"
        u"- unicode ascii title\n"
        u"Please click on the link below to review and take action "
        u"on your task(s) due today:\n"
        u"<a href='http://localhost/dashboard#!task&query={link}'>Link</a>"
    ).format(link=urllib.quote(link_not_encoded.encode('utf-8')))
    self.assertEquals(event.description, expected_description)

  @ddt.data((None, u"Your tasks are due today"),
            (u"TEST", u"[TEST] Your tasks are due today"))
  @ddt.unpack
  def test_create_event_with_relationship(self, prefix, expected_title):
    """Test create event with a relationship."""
    with factories.single_commit():
      person = factories.PersonFactory()
      task = wf_factories.CycleTaskGroupObjectTaskFactory(
          title=u"First task",
          end_date=date(2015, 1, 15),
      )
    with mock.patch("ggrc.settings.NOTIFICATION_PREFIX", new=prefix):
      self.builder = calendar_event_builder.CalendarEventBuilder()

    with freeze_time("2015-01-1 12:00:00"):
      event = self.builder._create_event_with_relationship(task, person.id)
      db.session.commit()

    self.assertEquals(event.title, expected_title)
    self.assertEquals(event.due_date, date(2015, 1, 15))
    self.assertEquals(event.attendee_id, person.id)
    relationship = self.get_relationship(task.id, event.id)
    self.assertIsNotNone(relationship)

  def test_generate_events_for_task_without_event(self):
    """Test generating events for tasks without event."""
    with factories.single_commit():
      person = factories.PersonFactory()
      task = wf_factories.CycleTaskGroupObjectTaskFactory(
          end_date=date(2015, 1, 5),
      )
      task.add_person_with_role_name(person, u"Task Assignees")
    with freeze_time("2015-01-1 12:00:00"):
      self.builder._preload_data()
      self.builder._generate_events()
    event = self.get_event(person.id, task.end_date)
    self.assertIsNotNone(event)
    relationship = self.get_relationship(task.id, event.id)
    self.assertIsNotNone(relationship)

  def test_generate_events_for_task_with_event_no_rel(self):
    """Test generating events for tasks with event but without relation."""
    with factories.single_commit():
      person = factories.PersonFactory()
      task = wf_factories.CycleTaskGroupObjectTaskFactory(
          end_date=date(2015, 1, 5),
      )
      factories.CalendarEventFactory(
          due_date=date(2015, 1, 5),
          attendee_id=person.id,
      )
      task.add_person_with_role_name(person, u"Task Secondary Assignees")
    with freeze_time("2015-01-1 12:00:00"):
      self.builder._preload_data()
      self.builder._generate_events()
      db.session.commit()
    event = self.get_event(person.id, task.end_date)
    self.assertIsNotNone(event)
    relationship = self.get_relationship(task.id, event.id)
    self.assertIsNotNone(relationship)

  def test_remove_event_for_tasks(self):
    """Test remove relationship to event."""
    person, task, event = self.setup_person_task_event(date(2015, 1, 10))
    task.status = task.DEPRECATED
    with freeze_time("2015-01-5 12:00:00"):
      self.builder._preload_data()
      self.builder._generate_events()
      db.session.commit()
    event = self.get_event(person.id, task.end_date)
    self.assertIsNotNone(event)
    relationship = self.get_relationship(task.id, event.id)
    self.assertIsNone(relationship)

  def test_build_cycle_tasks(self):
    """Test generating one Calendar Event based on several cycle tasks."""
    with factories.single_commit():
      person = factories.PersonFactory()
      tasks = [
          wf_factories.CycleTaskGroupObjectTaskFactory(
              title=u"First task",
              end_date=date(2015, 1, 5),
          ),
          wf_factories.CycleTaskGroupObjectTaskFactory(
              title=u"Second task",
              end_date=date(2015, 1, 5),
          )
      ]
      tasks[0].add_person_with_role_name(person, u"Task Assignees")
      tasks[1].add_person_with_role_name(person, u"Task Secondary Assignees")

    with freeze_time("2015-01-01 12:00:00"):
      self.builder.build_cycle_tasks()
    self.assertEquals(all_models.CalendarEvent.query.count(), 1)
    event = self.get_event(person.id, tasks[0].end_date)
    self.assertIsNotNone(event)
    self.assertEquals(event.title, u"Your tasks are due today")
    link_not_encoded = (
        u'(("Task Status" IN ("Finished","Declined") and '
        u'"Needs Verification"="Yes") '
        u'or ("Task Status" IN ("Assigned","In Progress"))'
        u') and "Task Due Date"=01/05/2015'
    )
    expected_description = (
        u"You have following tasks due today:\n"
        u"- First task\n"
        u"- Second task\n"
        u"Please click on the link below to review and take action "
        u"on your task(s) due today:\n"
        u"<a href='http://localhost/dashboard#!task&query={link}'>Link</a>"
    ).format(link=urllib.quote(link_not_encoded.encode('utf-8')))
    self.assertEquals(event.description, expected_description)
    for task in tasks:
      relationship = self.get_relationship(task.id, event.id)
      self.assertIsNotNone(relationship)

  @mock.patch("ggrc.gcalendar.calendar_event_builder.CalendarEventBuilder."
              "_should_create_event_for", side_effect=Exception("test"))
  def test_fail_to_build_event(self, should_create_mock):
    """Test that sync job tried to sync the second event after a failure."""
    self.setup_person_task_event(date(2015, 1, 5))
    self.setup_person_task_event(date(2015, 1, 6))
    with freeze_time("2015-01-1 12:00:00"):
      self.builder._preload_data()
      self.builder._generate_events()
    self.assertEqual(should_create_mock.call_count, 2)

  def test_event_delete_for_overdue_tasks(self):
    """Test that event is not deleted for overdue tasks."""
    _, task, event = self.setup_person_task_event(date(2015, 1, 1))
    with freeze_time("2015-01-05 12:00:00"):
      self.builder.build_cycle_tasks()
    relationship = self.get_relationship(task.id, event.id)
    self.assertIsNotNone(relationship)
