# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Date utils."""
import datetime


def closest_working_day():
  """Returns the nearest working day today or in past.
  Used for a datepicker that does not allow to choose weekends.
  """
  date = datetime.datetime.today()
  while _is_weekend(date):  # Saturday, Sunday
    date += datetime.timedelta(days=-1)
  return date.date()


def _is_weekend(date):
  """Returns whether the date is a weekend."""
  return date.isoweekday() in (6, 7)


def str_to_date(date_str, date_format):
  """Converts string in format `format` to date."""
  return datetime.datetime.strptime(date_str, date_format).date()
