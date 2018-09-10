# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Modal for creation people."""

from lib import base, decorator
from lib.constants import locator
from lib.utils import selenium_utils


class CreateNewPersonModal(base.Modal):
  """Modal for creation people."""
  _locators = locator.ModalCreateNewPerson

  def __init__(self, driver):
    super(CreateNewPersonModal, self).__init__(driver)
    self.modal_elem = selenium_utils.get_when_visible(
        self._driver, self._locators.MODAL_CSS)
    self.name_tf = base.TextInputField(
        self.modal_elem, self._locators.NAME)
    self.email_tf = base.TextInputField(
        self.modal_elem, self._locators.EMAIL)
    self.modal_type_lbl = base.Label(
        self.modal_elem, locator.ModalCommonConfirmAction.MODAL_TITLE)
    self.button_save_and_close = base.Button(
        self.modal_elem, self._locators.BUTTON_SAVE_AND_CLOSE)
    self.is_create_modal = "New Person" in self.modal_type_lbl.text

  def enter_name(self, text):
    """Enter name to modal."""
    self.name_tf.enter_text(text)

  def enter_email(self, text):
    """Enter email to modal."""
    self.email_tf.enter_text(text)

  @decorator.handle_alert
  def save_and_close(self):
    """Create person and close Creation modal."""
    self.button_save_and_close.click()
    selenium_utils.wait_until_not_present(
        self._driver, self._locators.BUTTON_SAVE_AND_CLOSE)
