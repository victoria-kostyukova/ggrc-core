# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Main integrations module."""


def get_jobs_to_register(name):
  """Get cron job handlers defined in `integrations` package.

  Get cron job handlers defined in `integrations` package as `name`.

  Args:
    name (str): A name of job handlers to get.

  Returns:
    A list containing job handlers of provided name.
  """
  from ggrc.integrations import cron_jobs
  return getattr(cron_jobs, name, [])
