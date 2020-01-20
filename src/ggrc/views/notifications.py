# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Views for email notifications."""

from ggrc.notifications import common, fast_digest, unsubscribe
from ggrc.gcalendar import common as gcalendar_common

from ggrc.login import login_required


def init_notification_views(app):
  """Add url rules for all notification views.

  Args:
    app: current flask app.
  """
  app.add_url_rule(
      "/_notifications/send_daily_digest", "create_daily_digest_bg",
      view_func=common.create_daily_digest_bg)

  app.add_url_rule(
      "/_notifications/show_pending", "show_pending_notifications",
      view_func=login_required(common.show_pending_notifications))

  app.add_url_rule(
      "/_notifications/show_daily_digest", "show_daily_digest_notifications",
      view_func=login_required(common.show_daily_digest_notifications))

  app.add_url_rule(
      "/_notifications/show_fast_digest",
      "show_fast_digest",
      view_func=login_required(fast_digest.present_notifications))

  app.add_url_rule(
      "/_notifications/send_calendar_events", "send_calendar_events",
      view_func=login_required(gcalendar_common.send_calendar_events))

  app.add_url_rule(
      "/_notifications/unsubscribe/<int:user_id>",
      "unsubscribe_from_notifications",
      view_func=login_required(unsubscribe.unsubscribe_from_notifications))
