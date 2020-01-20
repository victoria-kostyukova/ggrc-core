# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Fast emails digest."""

from lib import base, url, environment
from lib.entities import entity
from lib.utils import selenium_utils


class FastEmailsDigest(base.WithBrowser):
  """Fast emails digest page."""
  def __init__(self, driver=None):
    super(FastEmailsDigest, self).__init__(driver)
    self.emails_url = (environment.app_url + url.NOTIFICATIONS +
                       "/show_fast_digest")
    self._review_requests = self._browser.elements(
        xpath="//div/div[contains(., 'review was requested')]")
    self._reverted_reviews = self._browser.elements(
        xpath="//div/div[contains(., 'reverted to')]")
    self._proposals = self._browser.elements(
        xpath="//div/div[contains(., 'proposed changes')]")

  def open_digest_page(self):
    """Open page with fast emails digest."""
    selenium_utils.open_url(self.emails_url)

  def get_review_request_emails(self):
    """Get all review request notification emails."""
    return [ReviewNotificationItem(element).get_notification_email() for
            element in self._review_requests]

  def get_reverted_review_emails(self):
    """Get all notification emails about reviews reverted to 'Unreviewed'
    state."""
    return [ReviewNotificationItem(element).get_notification_email() for
            element in self._reverted_reviews]

  def get_proposal_emails(self):
    """Get all proposal notification emails."""
    return [ProposalDigestItem(element).get_proposal_email() for element in
            self._proposals]

  def click_proposal_email_open_btn(self, proposal_email):
    """Click on the proposal email open button."""
    proposal_emails = self.get_proposal_emails()
    index = proposal_emails.index(proposal_email)
    ProposalDigestItem(self._proposals[index]).open_btn_click()
    selenium_utils.wait_for_js_to_load(self._driver)


class BaseEmailItem(object):
  """Base class for notification emails."""
  def __init__(self, root_element):
    self._root_element = root_element

  def get_recipient_email(self):
    """Get email recipient."""
    return self._root_element.parent().previous_sibling(
        tag_name="h1").text.replace("email to ", "")


class ProposalDigestItem(BaseEmailItem):
  """Proposal notification email."""

  def get_proposal_email(self):
    """Get proposal email."""
    return entity.ProposalEmailUI(
        recipient_email=self.get_recipient_email(),
        author=self.get_proposal_author(),
        obj_type=self.get_proposal_obj_type(),
        changes=self.get_changes(),
        comment=self.get_comment()
    )

  def get_proposal_author(self):
    """Get proposal author."""
    return self._root_element.h1().text.split(" proposed ")[0]

  def get_proposal_obj_type(self):
    """Get proposal obj type."""
    return self._root_element.h1().text.split(" to ")[1].split(":")[0]

  def get_changes(self):
    """Get proposal changes need view."""
    changes_list = []
    for row in self._root_element.tbody().trs():
      row_element_texts = [element.text for element in row.tds()]
      change = {"obj_attr_type": row_element_texts[0],
                "proposed_value": row_element_texts[1]}
      changes_list.append(change)
    return changes_list

  def get_comment(self):
    """Get proposal comment."""
    comment_str = "".join(
        el.text for el in self._root_element.table().previous_siblings(
            tag_name="p"))
    return None if comment_str == "" else comment_str

  def open_btn_click(self):
    """Click on the open button in email."""
    self._root_element.link().click()


class ReviewNotificationItem(BaseEmailItem):
  """Review notification email."""

  def get_notification_email(self):
    """Get review request notification email entity."""
    return entity.ReviewEmailUI(
        recipient_email=self.get_recipient_email(),
        obj_type=self.get_obj_type(),
        obj_title=self.get_obj_title(),
        comment=self.get_email_message())

  def get_obj_type(self):
    """Get reviewable object type."""
    return self._root_element.element(tag_name="ul").text.split()[0]

  def get_obj_title(self):
    """Get reviewable object title."""
    return self._root_element.link().text

  def get_email_message(self):
    """Get email notification message."""
    message_element = self._root_element.element(tag_name="p")
    return message_element.text if message_element.exists else None
