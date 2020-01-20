# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Module for CalendarEvent model."""

import datetime

from ggrc import db
from ggrc.models.mixins import Base
from ggrc.models.relationship import Relatable

from sqlalchemy.orm import validates
from sqlalchemy.ext.declarative import declared_attr


class CalendarEvent(Relatable, Base, db.Model):
  """Model representing events for Calendar API."""
  __tablename__ = 'calendar_events'

  external_event_id = db.Column(db.String)
  title = db.Column(db.String)
  description = db.Column(db.String)
  due_date = db.Column(db.Date)
  last_synced_at = db.Column(db.DateTime)
  attendee_id = db.Column(
      db.Integer(), db.ForeignKey('people.id'), nullable=False
  )

  @declared_attr
  def attendee(cls):  # pylint: disable=no-self-argument
    """Relationship to user referenced by attendee_id."""
    return db.relationship(
        'Person',
        primaryjoin='{0}.attendee_id == Person.id'.format(cls.__name__),
        foreign_keys='{0}.attendee_id'.format(cls.__name__),
        remote_side='Person.id',
        uselist=False,
    )

  @validates("due_date")
  def validate_due_date(self, _, value):
    """Validator for due_date"""
    # pylint: disable=no-self-use
    return value.date() if isinstance(value, datetime.datetime) else value

  @property
  def calendar_end_date(self):
    """Returns end date for all-day event in calendar api."""
    return (self.due_date + datetime.timedelta(days=1)).strftime("%Y-%m-%d")

  @property
  def calendar_start_date(self):
    """Returns start date for all-day event in calendar api."""
    return self.due_date.strftime("%Y-%m-%d")

  @property
  def is_synced(self):
    """Indicates whether the event was synced or not."""
    return self.last_synced_at is not None

  @property
  def is_overdue(self):
    """Return True if event is overdue."""
    today = datetime.date.today()
    return self.due_date < today

  @property
  def needs_sync(self):
    """Indicates should we send this event to user or not."""
    return self.attendee.profile.send_calendar_events

  @property
  def needs_update(self):
    """Indicates should we update this event or not."""
    return not self.is_overdue

  @property
  def needs_delete(self):
    """Indicates should we delete this event or not."""
    return not self.is_overdue

  def json_equals(self, event_response):
    """Checks if event is equal to json representation."""
    return (event_response['description'] == self.description and
            event_response['summary'] == self.title and
            event_response['end']['date'] == self.calendar_end_date and
            event_response['start']['date'] == self.calendar_start_date)
