# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""This module contains gcalendar cron jobs."""


from ggrc.gcalendar import common as gcalendar_common


NIGHTLY_CRON_JOBS = [
    gcalendar_common.send_calendar_events,
]
