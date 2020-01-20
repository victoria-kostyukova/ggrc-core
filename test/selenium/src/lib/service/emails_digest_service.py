# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Services for create and manipulate email notification objects via UI."""
from lib import factory, base
from lib.constants import objects
from lib.page import fast_emails_digest, daily_emails


class BaseEmailsService(base.WithBrowser):
  """Base class for Emails Digest business layer's services objects."""

  def open_emails_digest(self):
    """Open page with emails digest. """
    self.digest_page.open_digest_page()


class FastEmailsService(BaseEmailsService):
  """Base class for Fast Emails Digest business layer's services objects."""

  @property
  def digest_page(self):
    return fast_emails_digest.FastEmailsDigest(self._driver)


class ProposalDigestService(FastEmailsService):
  """Class for Proposal Digest business layer's services objects."""

  def opened_obj(self, obj, proposal_email):
    """Build obj from page after clicking on the Open btn in the proposal
    notification email."""
    fast_emails_digest.FastEmailsDigest(
        self._driver).click_proposal_email_open_btn(proposal_email)
    obj_name = objects.get_plural(obj.type)
    service_cls = factory.get_cls_webui_service(obj_name)(self._driver)
    return service_cls.build_obj_from_page()


class ReviewDigestService(FastEmailsService):
  """Class for review notifications business layer's services objects."""

  def get_review_request_emails(self):
    """Get all review request notification emails."""
    self.open_emails_digest()
    return fast_emails_digest.FastEmailsDigest().get_review_request_emails()

  def get_reverted_review_emails(self):
    """Get all notification emails about reviews reverted to 'Unreviewed'
    state."""
    self.open_emails_digest()
    return (fast_emails_digest.FastEmailsDigest().
            get_reverted_review_emails())


class DailyEmailsService(BaseEmailsService):
  """Class for daily emails business layer's services objects."""

  @property
  def digest_page(self):
    return daily_emails.DailyEmails(self._driver)

  @classmethod
  def get_email_by_user_name(cls, user_name):
    """Get email by user name."""
    return daily_emails.DailyEmails().get_user_email(user_name)
