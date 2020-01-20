# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Error popup."""

from lib import base


class ErrorPopup(base.WithBrowser):
  """Error popup."""

  def __init__(self):
    super(ErrorPopup, self).__init__()
    self._root = self._browser.element(class_name="alert-error alert-autohide")

  def exists(self):
    """Checks if error popup exists."""
    return self._root.exists

  def wait_until_present(self):
    """Waits until present."""
    self._root.wait_until(lambda e: not e.exists)

  def close_popup(self):
    """Close popup."""
    self.wait_until_present()
    self._root.link(class_name="close").click()
