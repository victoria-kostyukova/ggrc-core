# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Module contains service for Google Calendar API."""

import logging
from apiclient import discovery
from googleapiclient.errors import HttpError


logger = logging.getLogger(__name__)


class CalendarApiService(object):
  """Service for Google Calendar API."""

  SCOPE = 'https://www.googleapis.com/auth/calendar'

  def __init__(self):
    """Initializes service object."""
    self.calendar_service = self.calendar_auth()
    self.num_retries = 3

  @staticmethod
  def _build_response_json(status_code, content):
    return {"status_code": status_code, "content": content}

  @staticmethod
  def calendar_auth(version='v3'):
    """Authentication to Google Calendar.

    Requires a Service Account to be configured.

    Args:
        version: Set Calendar API version.
    Returns:
        Calendar build authenticated service object.
    """
    return discovery.build('calendar', version)

  # pylint: disable=too-many-arguments
  def create_event(self, event_id, calendar_id, attendees,
                   start, end, **kwargs):
    """Creates an event in a given Google Calendar.

    Args:
        event_id: Event database id.
        calendar_id: Calendar ID where event will be created.
        start: event start datetime string.
        end: event start datetime string.
        attendees: comma-separated list of email attendees.
        kwargs: other event arguments.
    Returns:
        New event information.
    """

    event = {
        'summary': kwargs.get('summary', ''),
        'description': kwargs.get('description', ''),
        'start': {
            'date': start,
            'timeZone': kwargs.get('timezone', 'UTC'),
        },
        'end': {
            'date': end,
            'timeZone': kwargs.get('timezone', 'UTC'),
        },
        'attendees': [{'email': x} for x in attendees],
        'locked': kwargs.get('locked', True),
        'sendNotifications': kwargs.get('send_notifications', False),
        'guestsCanModify': kwargs.get('guests_can_modify', False),
        'guestsCanInviteOthers': kwargs.get('guests_can_invite', False),
        'transparency': kwargs.get('transparency', 'transparent'),
    }
    try:
      event = self.calendar_service.events().insert(
          calendarId=calendar_id, body=event
      ).execute(num_retries=self.num_retries)
      return self._build_response_json(200, event)
    except HttpError as err:
      logger.warn(
          "Create of the event %d has failed with HttpError. "
          "Error code: %s", event_id, err.resp.status
      )
      return self._build_response_json(err.resp.status, None)
    except Exception as exp:  # pylint: disable=broad-except
      logger.warn(
          "Create of the event %d has failed with %s.",
          event_id, exp.__class__.__name__,
      )
      return self._build_response_json(500, None)

  # pylint: disable=too-many-arguments
  def update_event(self, external_event_id, event_id, calendar_id,
                   attendees, start, end, **kwargs):
    """Updates event in the given Google Calendar.

    Args:
        calendar_id: Calendar ID where event will be created.
        external_event_id: External event id.
        event_id: Event database id.
        attendees: attendees of the event.
        start: event start datetime string.
        end: event start datetime string.
        kwargs: other event arguments.
    Returns:
        New event information.
    """
    event = {
        'summary': kwargs.get('summary', ''),
        'description': kwargs.get('description', ''),
        'start': {
            'date': start,
            'timeZone': kwargs.get('timezone', 'UTC'),
        },
        'end': {
            'date': end,
            'timeZone': kwargs.get('timezone', 'UTC'),
        },
        'attendees': [{'email': x} for x in attendees],
        'locked': kwargs.get('locked', True),
        'sendNotifications': kwargs.get('send_notifications', False),
        'guestsCanModify': kwargs.get('guests_can_modify', False),
        'guestsCanInviteOthers': kwargs.get('guests_can_invite', False),
        'transparency': kwargs.get('transparency', 'transparent'),
    }
    try:
      event = self.calendar_service.events().update(
          calendarId=calendar_id, body=event, eventId=external_event_id
      ).execute(num_retries=self.num_retries)
      return self._build_response_json(200, event)
    except HttpError as err:
      logger.warn(
          "Update of the event %d has failed with HttpError. "
          "Error code: %s", event_id, err.resp.status
      )
      return self._build_response_json(err.resp.status, None)
    except Exception as exp:  # pylint: disable=broad-except
      logger.warn(
          "Update of the event %d has failed with %s.",
          event_id, exp.__class__.__name__,
      )
      return self._build_response_json(500, None)

  def delete_event(self, calendar_id, external_event_id, event_id):
    """Deletes an event in a given Google Calendar.

     Args:
        calendar_id: Calendar ID from which event will be deleted.
        external_event_id: Google Calendar Event id.
        event_id: Event id in the database
    """
    calendar = self.calendar_auth()
    try:
      calendar.events().delete(
          calendarId=calendar_id,
          eventId=external_event_id
      ).execute(num_retries=self.num_retries)
      return self._build_response_json(200, None)
    except HttpError as err:
      logger.warn(
          "Deletion of the event %d has failed with HttpError. "
          "Error code: %s", event_id, err.resp.status
      )
      return self._build_response_json(err.resp.status, None)
    except Exception as exp:  # pylint: disable=broad-except
      logger.warn(
          "Deletion of the event %d has failed with %s.",
          event_id, exp.__class__.__name__,
      )
      return self._build_response_json(500, None)

  def get_event(self, calendar_id, external_event_id, event_id):
    """Gets an event in given Google Calendar.

     Args:
        calendar_id: Calendar ID from which event will be fetched.
        external_event_id: Google Calendar Event id.
        event_id: Google Calendar Event id.
    """
    try:
      event = self.calendar_service.events().get(
          calendarId=calendar_id, eventId=external_event_id
      ).execute(num_retries=self.num_retries)
      return self._build_response_json(200, event)
    except HttpError as err:
      logger.warn(
          "Get of the event %d has failed with HttpError. "
          "Error code: %s", event_id, err.resp.status
      )
      return self._build_response_json(err.resp.status, None)
    except Exception as exp:  # pylint: disable=broad-except
      logger.warn(
          "Get of the event %d has failed with %s.",
          event_id, exp.__class__.__name__,
      )
      return self._build_response_json(500, None)
