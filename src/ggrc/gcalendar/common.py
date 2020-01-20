# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""GCalendar module which contains functionality to sync calendar events."""

import logging

from ggrc import utils
from ggrc.utils import benchmark

from ggrc.gcalendar import calendar_event_builder
from ggrc.gcalendar import calendar_event_sync


logger = logging.getLogger(__name__)


def send_calendar_events():
  """Sends calendar events."""
  error_msg = None
  try:
    with benchmark("Send calendar events"):
      builder = calendar_event_builder.CalendarEventBuilder()
      builder.build_cycle_tasks()
      sync = calendar_event_sync.CalendarEventsSync()
      sync.sync_cycle_tasks_events()
  except Exception as exp:  # pylint: disable=broad-except
    logger.error(exp.message)
    error_msg = exp.message
  return utils.make_simple_response(error_msg)
