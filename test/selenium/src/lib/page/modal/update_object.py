# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Modals for compare and update objects."""

from lib import base
from lib.utils import selenium_utils


class CompareUpdateObjectModal(base.Modal):
  """Modal for compare version of objects and update them to latest version."""

  def __init__(self):
    super(CompareUpdateObjectModal, self).__init__()
    self._root = self._browser.element(class_name="modal hide")

  @property
  def button_update(self):
    """Return 'Update' button element."""
    return self._root.link(text="Update")

  def confirm_update(self):
    """Confirm update object."""
    selenium_utils.wait_for_js_to_load(self._driver)
    self.button_update.click()
    self.button_update.wait_until(lambda e: not e.present)
