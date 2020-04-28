# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Modals for delete objects."""
from lib import base
from lib.page.error_popup import ErrorPopup


class DeleteObjectModal(base.WithBrowser):
  """Modal for delete objects."""
  # pylint: disable=too-few-public-methods

  def __init__(self):
    super(DeleteObjectModal, self).__init__()
    self._root = self._browser.element(
        xpath="//span[contains(.,'Delete')]/../../..")

  def wait_until_modal_present(self):
    self._root.wait_until(lambda e: e.present)

  @property
  def _delete_btn(self):
    """Delete button."""
    return self._root.element(class_name="confirm-buttons").link(text="Delete")

  @property
  def _close_btn(self):
    """Close button."""
    return self._root.element(class_name="black")

  def confirm_delete(self):
    """Confirm delete object."""
    self._delete_btn.click()
    self._delete_btn.wait_until_not_present()

  def confirm_delete_causes_error(self):
    """Confirm delete object causes error."""
    self._delete_btn.click()
    return ErrorPopup()

  def close_modal(self):
    """Clicks close button."""
    self._close_btn.click()
    self._close_btn.wait_until_not_present()
