# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests calendar event model."""

from datetime import date

from ggrc.models import all_models
from integration.ggrc import api_helper
from integration.ggrc.gcalendar import BaseCalendarEventTest


# pylint: disable=protected-access
class TestCalendarEventModel(BaseCalendarEventTest):
  """Test calendar event model."""

  def setUp(self):
    """Set up test with mocks."""
    super(TestCalendarEventModel, self).setUp()
    self.client.get("/login")
    self.api = api_helper.Api()

  def test_cycle_task_relationships(self):
    """Test that related sources and destinations of CycleTaskGroupObjectTask
       does not contain relationships to CalendarEvent in json representation.
    """
    _, task, event = self.setup_person_task_event(date(2015, 1, 5))
    relationship = self.get_relationship(task.id, event.id)

    db_task = all_models.CycleTaskGroupObjectTask.query.get(task.id)
    sources_ids = [rel.id for rel in db_task.related_sources]
    destinations_ids = [rel.id for rel in db_task.related_destinations]
    self.assertTrue(relationship.id in sources_ids or
                    relationship.id in destinations_ids)

    response = self.api.get_query(all_models.CycleTaskGroupObjectTask,
                                  '__sort=id')
    task_collection = response.json['cycle_task_group_object_tasks_collection']
    task_json = task_collection['cycle_task_group_object_tasks'][0]

    sources_ids = []
    for item in task_json['related_sources']:
      sources_ids.append(item['id'])
    destinations_ids = []
    for item in task_json['related_destinations']:
      destinations_ids.append(item['id'])

    self.assertTrue(relationship.id not in sources_ids)
    self.assertTrue(relationship.id not in destinations_ids)
