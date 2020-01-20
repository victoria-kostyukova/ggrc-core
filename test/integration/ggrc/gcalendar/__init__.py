# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Module for testing google calendar integration."""

from ggrc.models import all_models
from integration.ggrc import TestCase
from integration.ggrc.models import factories
from integration.ggrc_workflows.models import factories as wf_factories


class BaseCalendarEventTest(TestCase):
  """Base class for testing Calendar Events."""

  @staticmethod
  def get_relationship(task_id, event_id):
    """Gets relationship between cycle task and calendar event."""
    rel_model = all_models.Relationship
    relationship = rel_model.query.filter(
        rel_model.source_id == task_id,
        rel_model.source_type == "CycleTaskGroupObjectTask",
        rel_model.destination_type == "CalendarEvent",
        rel_model.destination_id == event_id,
    ).first()
    return relationship

  @staticmethod
  def get_event(person_id, end_date):
    return all_models.CalendarEvent.query.filter(
        all_models.CalendarEvent.attendee_id == person_id,
        all_models.CalendarEvent.due_date == end_date,
    ).first()

  @staticmethod
  def setup_person_task_event(end_date):
    """Setup task with person and event."""
    with factories.single_commit():
      person = factories.PersonFactory()
      task = wf_factories.CycleTaskGroupObjectTaskFactory(
          end_date=end_date,
      )
      event = factories.CalendarEventFactory(
          due_date=end_date,
          attendee_id=person.id,
      )
      # pylint: disable=protected-access
      for acl in task._access_control_list:
        factories.AccessControlPersonFactory(ac_list=acl, person=person)
      factories.RelationshipFactory(source=task, destination=event)
    return person, task, event
