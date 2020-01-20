# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Date utils."""
import datetime
import time

from dateutil import tz


def first_not_weekend_day(date):
  """Returns the nearest not weekend day today or in past.
  Used for a datepicker that does not allow to choose weekends.
  """
  while _is_weekend(date):
    date += datetime.timedelta(days=-1)
  return date


def first_working_day(date):
  """Returns the nearest working day today or in past.
  This algorithm is used when back-end generates a cycle task.
  """
  while _is_weekend(date):
    date += datetime.timedelta(days=-1)
  return date


def first_working_day_after_today(date=datetime.date.today()):
  """Returns the nearest working day today or in future.
  """
  date = date + datetime.timedelta(days=1)
  while _is_weekend(date):
    date += datetime.timedelta(days=1)
  return date


def _is_weekend(date):
  """Returns whether the date is a weekend."""
  return date.isoweekday() in (6, 7)  # Saturday, Sunday


def str_to_date(date_str, date_format):
  """Converts string in format `format` to date."""
  return str_to_datetime(date_str, date_format).date()


def str_to_datetime(datetime_str, datetime_format):
  """Converts string in format to datetime."""
  return datetime.datetime.strptime(datetime_str, datetime_format)


def ui_str_with_zone_to_datetime(datetime_str):
  """Converts datetime string with zone offset to datetime.
  Datetimes shown in UI are in local timezone.
  """
  # Last 7 symbols are the UTC offset in +(-)HH:MM format. It is not
  # needed to be converted because all datetimes in UI should be shown
  # in user's local timezone.
  # %z directive doesn't seem to work in Python 2.7
  return str_to_datetime(datetime_str[:-7], "%m/%d/%Y %I:%M:%S %p").replace(
      tzinfo=tz.tzlocal())


def iso8601_to_datetime(iso8601_str):
  """Converts ISO 8601 (yyyy-mm-ddThh:mm:ss) string to datetime.
  Datetimes returned by API are in UTC.
  """
  return str_to_datetime(iso8601_str, "%Y-%m-%dT%H:%M:%S").replace(
      tzinfo=tz.tzutc())


def iso8601_to_local_datetime(iso8601_str):
  """Converts ISO 8601 (yyyy-mm-ddThh:mm:ss) string to datetime.
  Datetimes returned by API are in UTC.
  """
  return iso8601_to_datetime(iso8601_str).astimezone(tz.tzlocal())


def assert_chronological_order(list_of_datetimes):
  """Assert that items sorted by datetime desc (newer items are first)."""
  for i in range(len(list_of_datetimes) - 1):
    current_item, next_item = list_of_datetimes[i], list_of_datetimes[i + 1]
    assert current_item >= next_item


def iso8601_to_ui_str_with_zone(iso8601_str):
  """Converts ISO 8601 (yyyy-mm-ddThh:mm:ss) string to
   (mm/dd/yyyy hh:mm:ss AM/PM) format."""
  return datetime.datetime.strftime(
      iso8601_to_local_datetime(iso8601_str), "%m/%d/%Y %I:%M:%S %p")


def iso8601_to_ui_str_date(iso8601_str):
  """Converts ISO 8601 (yyyy-mm-ddThh:mm:ss) string to (mm/dd/yyyy) format."""
  return datetime.datetime.strftime(
      iso8601_to_datetime(iso8601_str), "%m/%d/%Y")


def user_timezone_offset():
  """Returns user timezone offset in seconds."""
  return (time.mktime(datetime.datetime.now().timetuple()) -
          time.mktime(datetime.datetime.utcnow().timetuple()))


def user_timezone_offset_min_str():
  """Returns user timezone offset in minutes in string."""
  return str(int(user_timezone_offset() / 60))
