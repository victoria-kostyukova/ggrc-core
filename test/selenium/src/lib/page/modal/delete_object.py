# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Modals for delete objects."""
from lib import base


class DeleteObjectModal(base.WithBrowser):
  """Modal for delete objects."""
  # pylint: disable=too-few-public-methods

  def confirm_delete(self):
    """Confirm delete object."""
    delete_button = self._browser.element(
        class_name="ggrc_controllers_delete").link(text="Delete")
    delete_button.click()
    delete_button.wait_until_not_present()
