# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Modal for comparing object versions and apply or decline the proposal."""

from lib import base
from lib.constants import timeouts
from lib.utils import date_utils, selenium_utils


class CompareApplyDeclineModal(base.Modal):
  """Modal for comparing object versions and apply or decline the proposal."""
  # pylint: disable=too-few-public-methods

  def __init__(self, driver=None):
    super(CompareApplyDeclineModal, self).__init__(driver)
    self.modal = self._browser.div(class_name="compare-modal")
    self._obj_versions = self.modal.divs(class_name="tier-content")
    self.modal_header_info = self.modal.element(
        class_name="modal-header").elements(class_name="column-content")
    self.curr_version_obj_root_elem = self._obj_versions[0]
    self.proposal_version_obj_root_elem = self._obj_versions[1]

  def get_proposal_version_author(self):
    """Get proposal version author."""
    return self.modal_header_info[1].text.splitlines()[1]

  def get_proposal_version_datetime(self):
    """Get proposal version datetime."""
    return date_utils.ui_str_with_zone_to_datetime(
        self.modal_header_info[1].text.splitlines()[2])

  def click_apply_btn(self):
    """Click on the apply button."""
    self._click_btn_by_text("Apply")

  def click_cancel_btn(self):
    """Click on the cancel button."""
    self._click_btn_by_text("Cancel")

  def click_decline_btn(self):
    """Click on the decline button."""
    self._click_btn_by_text("Decline")

  def _click_btn_by_text(self, btn_text):
    """Click on the button with btn_text."""
    selenium_utils.wait_for_js_to_load(self._driver)
    self.modal.button(text=btn_text).click()
    self.modal.wait_until_not(
        method=lambda e: e.present, timeout=timeouts.TWO_MIN_USER_WAIT)
