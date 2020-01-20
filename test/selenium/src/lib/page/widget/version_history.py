# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Version History."""
# pylint: disable=too-few-public-methods
from lib import base


class VersionHistory(base.WithBrowser):
  """Represents Version History element."""

  def is_version_history_displayed(self):
    """Returns whether Version History is displayed on page."""
    return self._browser.element(tag_name="related-revisions").exists
