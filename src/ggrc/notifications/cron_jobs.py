# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""This module contains notification cron jobs."""

from ggrc.notifications import common as notif_common
from ggrc.notifications import fast_digest as notif_fast_digest
from ggrc.notifications import import_export as notif_import_export


NIGHTLY_CRON_JOBS = [
    notif_common.generate_cycle_tasks_notifs,
    notif_common.create_daily_digest_bg,
]


HALF_HOUR_CRON_JOBS = [
    notif_fast_digest.send_notification,
]


IMPORT_EXPORT_JOBS = [
    notif_import_export.check_import_export_jobs,
]
