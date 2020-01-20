# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""A module with functions related to unsubscribing from notifications."""

from logging import getLogger

import urlparse

from flask import render_template

from ggrc import db
from ggrc.models import NotificationConfig
from ggrc.login import get_current_user
from ggrc.utils import get_url_root

# pylint: disable=invalid-name
logger = getLogger(__name__)


def unsubscribe_from_notifications(user_id):
  """Unsubscribe the owner of the given email from daily notifications.

  For the action to succeed, the email owner must be logged in with that email,
  otherwise an authorization error is returned.

  Args:
    user_id (int): user's id

  Returns:
    HTTP response indicating the outcome of the action requested.
  """
  current_user = get_current_user()

  def render_unsubscribe_template(result, msg, status_code=200):
    return render_template(
        "unsubscribe/index.haml",
        result=result.upper(),
        unsubscribe_message=msg,
        is_error=status_code == 500
    ), status_code

  if current_user.id != user_id:
    msg = u"User (%s) tried to unsubscribe a user other than self (%s)"
    logger.warning(msg, current_user.id, user_id)
    return render_unsubscribe_template(
        "Not unsubscribed",
        "Cannot unsubscribe other people",
        403
    )

  instance = db.session.query(
      NotificationConfig
  ).filter(
      NotificationConfig.person_id == current_user.id,
      NotificationConfig.notif_type == "Email_Digest"
  ).first()

  try:
    if instance:
      instance.enable_flag = False
    else:
      instance = NotificationConfig(
          person_id=current_user.id,
          notif_type="Email_Digest",
          enable_flag=False,
          modified_by_id=current_user.id,
      )
      db.session.add(instance)
    db.session.commit()
  except Exception as e:  # pylint: disable=broad-except
    logger.exception(e.message)
    return render_unsubscribe_template(
        "Unsubscribed Failed",
        current_user.email,
        500
    )
  return render_unsubscribe_template(
      "You have been unsubscribed",
      current_user.email
  )


def unsubscribe_url(user_id):
  """Generate a user-specific URL for unsubscribing from notifications.

  Args:
    id (int): user's id

  Returns:
    url (string): unsubscribe URL
  """
  url = urlparse.urljoin(
      get_url_root(),
      "_notifications/unsubscribe/{}".format(user_id)
  )
  return url
