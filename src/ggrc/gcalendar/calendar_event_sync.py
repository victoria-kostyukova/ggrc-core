# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

""" Module contains CalendarEventSync class."""

import datetime
from logging import getLogger

from sqlalchemy.orm import load_only
from sqlalchemy import orm

from ggrc import db
from ggrc.models import all_models
from ggrc.gcalendar import calendar_api_service, utils
from ggrc.utils import benchmark, generate_query_chunks


logger = getLogger(__name__)


# pylint: disable=too-few-public-methods
class CalendarEventsSync(object):
  """Class with methods for sync CalendarEvents to Calendar API."""

  NOT_FOUND = 404
  SUCCESS = 200

  def __init__(self):
    self.service = calendar_api_service.CalendarApiService()
    self.calendar_id = "primary"
    self.chunk_size = 1000

  def sync_cycle_tasks_events(self):
    """Generates Calendar Events descriptions."""
    with benchmark("Sync of calendar events."):
      events = all_models.CalendarEvent.query.options(
          orm.joinedload("attendee").load_only(
              "email",
          ),
          orm.joinedload("attendee").joinedload("profile").load_only(
              "send_calendar_events",
          ),
          load_only(
              all_models.CalendarEvent.id,
              all_models.CalendarEvent.external_event_id,
              all_models.CalendarEvent.title,
              all_models.CalendarEvent.description,
              all_models.CalendarEvent.attendee_id,
              all_models.CalendarEvent.due_date,
              all_models.CalendarEvent.last_synced_at,
          )
      ).order_by(all_models.CalendarEvent.due_date)
      event_mappings = utils.get_related_mapping(
          left=all_models.CalendarEvent,
          right=all_models.CycleTaskGroupObjectTask
      )
      all_count = events.count()
      handled = 0
      for query_chunk in generate_query_chunks(
          events, chunk_size=self.chunk_size, needs_ordering=False
      ):
        chunk_objects = query_chunk.all()
        handled += len(chunk_objects)
        logger.info("Sync of calendar events: %s/%s", handled, all_count)
        for event in chunk_objects:
          if not event.needs_sync:
            continue
          if event.id not in event_mappings or not event_mappings[event.id]:
            if not event.is_synced:
              db.session.delete(event)
            else:
              self._delete_event(event)
            continue
          if not event.is_synced:
            self._create_event(event)
            continue
          self._update_event(event)
      db.session.commit()

  def _update_event(self, event):
    """Updates the provided event using CalendarApiService."""
    if not event.needs_update:
      return
    response = self.service.get_event(
        calendar_id=self.calendar_id,
        external_event_id=event.external_event_id,
        event_id=event.id,
    )
    if response["status_code"] == self.NOT_FOUND:
      db.session.delete(event)
      return
    if not response["content"]:
      return
    if (response["status_code"] == self.SUCCESS and
       not event.json_equals(response["content"])):
      response = self.service.update_event(
          event_id=event.id,
          external_event_id=event.external_event_id,
          calendar_id=self.calendar_id,
          description=event.description,
          summary=event.title,
          start=event.calendar_start_date,
          end=event.calendar_end_date,
          timezone="UTC",
          attendees=[event.attendee.email],
      )
      if response["status_code"] == self.SUCCESS:
        event.last_synced_at = datetime.datetime.utcnow()

  def _delete_event(self, event):
    """Deletes the provided event using CalendarApiService."""
    if not event.needs_delete:
      return
    response = self.service.get_event(
        calendar_id=self.calendar_id,
        external_event_id=event.external_event_id,
        event_id=event.id,
    )
    if response["status_code"] == self.NOT_FOUND:
      db.session.delete(event)
      return
    self.service.delete_event(calendar_id=self.calendar_id,
                              external_event_id=event.external_event_id,
                              event_id=event.id)
    if response["status_code"] == self.SUCCESS:
      db.session.delete(event)

  def _create_event(self, event):
    """Creates new event using CalendarApiService."""
    response = self.service.create_event(
        event_id=event.id,
        calendar_id=self.calendar_id,
        summary=event.title,
        description=event.description,
        start=event.calendar_start_date,
        end=event.calendar_end_date,
        timezone="UTC",
        attendees=[event.attendee.email],
        send_notifications=False
    )
    if response["status_code"] == self.SUCCESS:
      event.external_event_id = response["content"]["id"]
      event.last_synced_at = datetime.datetime.utcnow()
