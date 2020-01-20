# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Daily emails."""

from lib import base, constants, url, environment
from lib.entities import entity
from lib.utils import selenium_utils


class DailyEmails(base.WithBrowser):
  """Daily emails page."""
  def __init__(self, driver=None):
    super(DailyEmails, self).__init__(driver)
    self.daily_emails_url = (environment.app_url + url.NOTIFICATIONS +
                             "/show_daily_digest")

  def open_digest_page(self):
    """Open page with daily emails."""
    selenium_utils.open_url(self.daily_emails_url)
    selenium_utils.wait_for_doc_is_ready(self._driver)
    self._browser.element(xpath="//h1[contains(text(),'digest')]").wait_until(
        lambda e: e.present, timeout=constants.timeouts.MAX_USER_WAIT_SECONDS)

  def user_email_element(self, user_name):
    """Get user's email element."""
    return self._browser.element(xpath="//h1[contains(., '{}')]/..".format(
        user_name))

  def get_user_email(self, user_name):
    """Get user's email."""
    return DailyEmailItem(self.user_email_element(user_name)).get_email()


class DailyEmailItem(object):
  """Daily notification email."""
  def __init__(self, root_element):
    self._root_element = root_element

  def get_email(self):
    """Get email."""
    return entity.DailyEmailUI(
        email_recipient=self.email_recipient,
        assigned_tasks=self.assigned_tasks,
        due_soon_tasks=self.due_soon_tasks,
        new_wf_cycles=self.new_wf_cycles
    )

  @property
  def email_recipient(self):
    """Get email recipient."""
    # last symbol is a dot
    return self._root_element.h1().text.replace("Hi, ", "")[:-1]

  def get_notif_section_info(self, key_phrase):
    """Get info from notification section."""
    element = None
    for elem in self._root_element.h2s():
      if key_phrase in elem.text:
        element = elem
    if element is None:
      return []
    return [elem.text for elem in element.following_sibling(
        tag_name="ul").links()]

  @property
  def assigned_tasks(self):
    """Get assigned tasks."""
    return self.get_notif_section_info('assigned to you')

  @property
  def due_soon_tasks(self):
    """Get due soon tasks."""
    return self.get_notif_section_info('due very soon')

  @property
  def new_wf_cycles(self):
    """Get new workflow cycles."""
    return self.get_notif_section_info('started')
