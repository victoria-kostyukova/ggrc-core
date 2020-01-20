# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""This module contains converters cron jobs."""

from ggrc.models import import_export


NIGHTLY_CRON_JOBS = [
    import_export.clear_overtimed_tasks,
]
