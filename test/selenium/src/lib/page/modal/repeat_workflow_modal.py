# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Modal for setting repeat workflow."""

from lib import base


class RepeatWorkflowModal(base.Modal):
  """Modal for setting repeat workflow."""

  def __init__(self, driver=None):
    super(RepeatWorkflowModal, self).__init__(driver)
    self.modal = self._browser.div(class_name="repeat-on")

  def set_repeat_checkbox(self):
    """Set repeat checkbox."""
    self.modal.wait_until(lambda e: e.exists).element(
        id="repeat-checkbox").to_subtype().set()

  def set_repeats_select(self, repeat_period):
    """Choose repeat period."""
    self.modal.wait_until(lambda e: e.exists).element(
        id="repeats-select").select().select_value(repeat_period)

  def click_save_and_close_btn(self):
    """Click on save and close button."""
    self.modal.button(class_name="btn-green").click()
    self.modal.wait_until_not_present()
