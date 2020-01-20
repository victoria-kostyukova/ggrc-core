# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Modal for requesting review."""

from lib import base
from lib.utils import selenium_utils, ui_utils


class RequestReviewModal(base.Modal):
  """Modal for requesting review."""

  def __init__(self, driver):
    super(RequestReviewModal, self).__init__(driver)
    self._root = self._browser.element(class_name="request-review-modal")
    self.assignee_field = self._root.text_field(placeholder="Add person")
    self.request_button = self._root.button(text="Request")

  @property
  def comment_input(self):
    return base.CommentInput(self._root)

  def select_assignee_user(self, user_email):
    """Select assignee user from dropdown on submit for review popup."""
    self.assignee_field.set(user_email)
    ui_utils.select_user(self._browser, user_email)

  def leave_request_review_comment(self, comment_msg):
    """Leave request review comment."""
    self.comment_input.fill(comment_msg)

  def click_request(self):
    """Click Request button."""
    self.request_button.click()
    selenium_utils.wait_for_js_to_load(self._driver)

  def fill_and_submit(self, user_email, comment_msg):
    """Fill modal fields to assign user as reviewer."""
    self.select_assignee_user(user_email)
    self.leave_request_review_comment(comment_msg)
    self.click_request()

  def wait_until_present(self):
    """Waits until present."""
    return self._root.wait_until(lambda e: e.exists)
