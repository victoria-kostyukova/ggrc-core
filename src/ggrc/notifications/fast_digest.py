# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""  Fast digest handlers """
from datetime import datetime
import itertools

from werkzeug import exceptions

from ggrc import db
from ggrc import rbac
from ggrc import settings

from ggrc.notifications import common as notif_common
from ggrc.notifications import data_handlers
from ggrc.notifications import proposal_helpers
from ggrc.notifications import review_helpers


DIGEST_TITLE_TMPL = "GGRC Change requests review digest for {}"
DIGEST_TMPL = settings.JINJA2.get_template("notifications/fast_digest.html")


def build_subject():
  """Build notification subject."""
  user_datetime = data_handlers.as_user_time(
      datetime.utcnow(),
  )
  return DIGEST_TITLE_TMPL.format(user_datetime)


def build_address_body(proposals, review_notifications):
  """yields email address and email body"""
  proposal_dict = proposal_helpers.build_prosal_data(proposals)
  review_dict = review_helpers.build_review_data(review_notifications)
  people = set(
      itertools.chain(
          proposal_dict.iterkeys(),
          review_dict["review_requested_data"].iterkeys(),
          review_dict["object_state_reverted_data"].iterkeys()
      )
  )
  for addressee in people:
    review_reviewers_data = review_dict["review_requested_data"][addressee]
    review_owners_data = review_dict["object_state_reverted_data"][addressee]
    proposals = proposal_dict[addressee]
    body = DIGEST_TMPL.render(
        proposals=proposals.values(),
        review_requested_data=review_reviewers_data.values(),
        object_state_reverted_data=review_owners_data.values(),
    )
    yield (addressee, body)


def send_notification():
  """Send notifications about proposals."""
  proposals = proposal_helpers.get_email_proposal_list()
  review_notifications = review_helpers.get_review_notifications()
  subject = build_subject()
  for addressee, html in build_address_body(proposals,
                                            review_notifications):
    notif_common.send_email(
        user_email=addressee.email,
        subject=subject,
        body=html,
    )

  proposal_helpers.mark_proposals_sent(proposals)
  review_helpers.move_notifications_to_history(review_notifications)
  db.session.commit()


def present_notifications():
  """Present fast digest notifications."""
  if not rbac.permissions.is_admin():
    raise exceptions.Forbidden()
  proposals = proposal_helpers.get_email_proposal_list()
  review_notifications = review_helpers.get_review_notifications()
  generator = (
      u"<h1> email to {}</h1>\n {}".format(addressee.email, body)
      for addressee, body in build_address_body(proposals,
                                                review_notifications)
  )
  return u"".join(generator)
