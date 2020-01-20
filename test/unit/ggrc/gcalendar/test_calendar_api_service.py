# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test api service for google calendar."""

from collections import namedtuple
import unittest
import ddt
import mock
import requests
from googleapiclient.errors import HttpError

from ggrc.gcalendar import calendar_api_service


ErrorResp = namedtuple("ERROR_RESP", ["status", "reason"])


@ddt.ddt
class TestCalendarApiService(unittest.TestCase):
  """Test calendar api service methods."""

  def setUp(self):
    """Set up mocks for testing."""
    calendar_api_service.CalendarApiService.calendar_auth = mock.MagicMock()
    self.service = calendar_api_service.CalendarApiService()
    self.events_mock = mock.MagicMock()
    self.service.calendar_service.events = mock.MagicMock(
        return_value=self.events_mock
    )

  def test_create_event(self):
    """Test creation of an event."""
    self.events_mock.insert = mock.MagicMock()
    response = self.service.create_event(
        event_id=1,
        calendar_id="primary",
        summary="test calendar event",
        description="test calendar event description",
        start="2018-01-01",
        end="2018-01-01",
        timezone="UTC",
        attendees=["someuser@example.com"],
        send_notifications=False
    )
    expected_body = {
        "summary": "test calendar event",
        "description": "test calendar event description",
        "start": {
            "date": "2018-01-01",
            "timeZone": "UTC",
        },
        "end": {
            "date": "2018-01-01",
            "timeZone": "UTC",
        },
        "attendees": [{"email": "someuser@example.com"}],
        "locked": True,
        "sendNotifications": False,
        "guestsCanModify": False,
        "guestsCanInviteOthers": False,
        "transparency": "transparent",
    }
    self.assertEquals(response['status_code'], 200)
    self.events_mock.insert.assert_called_with(calendarId="primary",
                                               body=expected_body)

  @ddt.data(
      (HttpError(resp=ErrorResp(status=403, reason="reason"),
                 content="Test",), 403),
      (requests.exceptions.RequestException, 500),
  )
  @ddt.unpack
  def test_create_event_error(self, error, code):
    """Test creation of an event with raised HttpError."""
    self.events_mock.insert = mock.MagicMock()
    self.events_mock.insert.side_effect = error
    response = self.service.create_event(
        event_id=1,
        calendar_id="primary",
        summary="test calendar event with http error",
        description="test calendar event description",
        start="2018-02-01",
        end="2018-02-01",
        timezone="UTC",
        attendees=["someuser@example.com"],
        send_notifications=False
    )
    self.assertEquals(response, {"content": None, "status_code": code})

  def test_update_event(self):
    """Test update of an event."""
    self.events_mock.update = mock.MagicMock()
    response = self.service.update_event(
        event_id=1,
        calendar_id="primary",
        summary="test calendar event",
        description="test calendar event description",
        external_event_id="SOMEID12345",
        start="2018-01-01",
        end="2018-01-01",
        timezone="UTC",
        attendees=["someuser@example.com"],
    )
    self.assertEquals(response['status_code'], 200)
    expected_body = {
        "summary": "test calendar event",
        "description": "test calendar event description",
        "start": {
            "date": "2018-01-01",
            "timeZone": "UTC",
        },
        "end": {
            "date": "2018-01-01",
            "timeZone": "UTC",
        },
        "attendees": [{"email": "someuser@example.com"}],
        "locked": True,
        "sendNotifications": False,
        "guestsCanModify": False,
        "guestsCanInviteOthers": False,
        "transparency": "transparent",
    }
    self.events_mock.update.assert_called_with(
        calendarId="primary",
        eventId="SOMEID12345",
        body=expected_body
    )

  @ddt.data(
      (HttpError(resp=ErrorResp(status=403, reason="reason"),
                 content="Test",), 403),
      (requests.exceptions.RequestException, 500),
  )
  @ddt.unpack
  def test_update_event_error(self, error, code):
    """Test update of an event with raised HttpError."""
    self.events_mock.update = mock.MagicMock()
    self.events_mock.update.side_effect = error
    response = self.service.update_event(
        event_id=1,
        calendar_id="primary",
        summary="test calendar event with http error",
        external_event_id="SOMEID12345",
        description="test calendar event description",
        start="2018-02-01",
        end="2018-02-01",
        timezone="UTC",
        attendees=["someuser@example.com"],
    )
    self.assertEquals(response, {"content": None, "status_code": code})

  def test_delete_event(self):
    """Test delete of an event."""
    self.events_mock.delete = mock.MagicMock()
    response = self.service.delete_event(
        calendar_id="primary",
        external_event_id="SOMEID12345",
        event_id=1,
    )
    self.assertEquals(response['status_code'], 200)
    self.events_mock.delete.assert_called_with(
        calendarId="primary",
        eventId="SOMEID12345",
    )

  def test_get_event(self):
    """Test get of an event."""
    self.events_mock.get = mock.MagicMock()
    response = self.service.get_event(
        calendar_id="primary",
        external_event_id="SOMEID12345",
        event_id=1,
    )
    self.assertEquals(response['status_code'], 200)
    self.events_mock.get.assert_called_with(
        calendarId="primary",
        eventId="SOMEID12345",
    )
