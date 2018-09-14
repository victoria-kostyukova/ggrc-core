# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Proposals digest."""

from lib import base, environment
from lib.entities import entity
from lib.utils import selenium_utils


class ProposalDigest(base.WithBrowser):
  """Proposals digest page."""
  proposal_digest_url = (environment.app_url +
                         "/_notifications/show_proposal_digest")

  def __init__(self, driver):
    super(ProposalDigest, self).__init__(driver)
    self.tag_h1 = "h1"
    self.tag_a = "a"
    self.tag_table = "table"
    self.tag_tbody = "tbody"
    self.tag_tr = "tr"
    self.tag_p = "p"
    self.elements = self._browser.elements(xpath="//div")

  def open_proposal_digest(self):
    """Open page with proposal emails."""
    selenium_utils.open_url(self._driver, self.proposal_digest_url)

  def get_proposal_emails(self):
    """Get all emails about"""
    return [self.get_proposal_email(element) for element in self.elements]

  def get_proposal_email(self, root_element):
    """Get proposal email."""
    return entity.ProposalEmailUI(
        recipient_email=self.get_recipient_email(root_element),
        author=self.get_proposal_author(root_element),
        obj_type=self.get_proposal_obj_type(root_element),
        changes=self.get_changes(root_element),
        comment=self.get_comment(root_element)
    )

  def get_recipient_email(self, root_element):
    """Get email recipient."""
    return root_element.previous_sibling(
        tag_name=self.tag_h1).text.replace("email to ", "")

  def get_proposal_author(self, root_element):
    """Get proposal author."""
    return root_element.child(
        tag_name=self.tag_h1).text.split(" proposed ")[0]

  def get_proposal_obj_type(self, root_element):
    """Get proposal obj type."""
    return root_element.child(
        tag_name=self.tag_h1).text.split(" to ")[1].split(":")[0]

  def get_changes(self, root_element):
    """Get proposal changes need view."""
    changes_keys = ["obj_attr_type", "proposed_value"]
    changes_values_list = self.get_proposal_email_changes(root_element)
    return [{k: v for k, v in zip(changes_keys, changes_values)}
            for changes_values in changes_values_list]

  def get_proposal_email_changes(self, root_element):
    """Get proposal changes."""
    return [element.text.splitlines() for element in
            root_element.element(tag_name=self.tag_tbody).elements(
                tag_name=self.tag_tr)]

  def get_comment(self, root_element):
    """Get proposal comment."""
    comment_str = ""
    for element in (root_element.child(
        tag_name=self.tag_table).previous_siblings(tag_name=self.tag_p)
    ):
      comment_str = comment_str + element.text
    return None if comment_str == "" else comment_str

  def open_btn_click(self, root_element):
    """Click on the open button in email."""
    root_element.child(tag_name=self.tag_a).click()

  def click_open_btn_by_index(self, index):
    """Click on the open button by email index."""
    self.open_btn_click(self.elements[index])
    selenium_utils.wait_for_js_to_load(self._driver)
