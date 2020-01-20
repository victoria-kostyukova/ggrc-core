# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Main gcalendar module."""

import logging

from ggrc import settings


logger = logging.getLogger(__name__)


def get_jobs_to_register(name):
  """Get cron job handlers defined in `gcalendar` package.

  Get cron job handlers defined in `gcalendar` package as `name`.

  Args:
    name (str): A name of job handlers to get.

  Returns:
    A list containing job handlers of provided name.
  """
  if not settings.GCALENDAR_ENABLED:
    logger.warning("Could not get `%s` job handlers. GCalendar sync"
                   "is disabled. Use `GCALENDAR_ENABLED` setting to "
                   "enable sync with GCalendar.",
                   name)
    return []

  from ggrc.gcalendar import cron_jobs
  return getattr(cron_jobs, name, [])
