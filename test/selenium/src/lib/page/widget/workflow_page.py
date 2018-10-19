# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Represents any tab of workflow page."""
from lib import base
from lib.utils import ui_utils


class WorkflowPage(base.WithBrowser):
  """Represents any tab of workflow page."""
  # pylint: disable=too-few-public-methods

  def activate_workflow(self):
    """Activates workflow."""
    self._browser.button(text="Activate Workflow").click()
    self._browser.link(text="Proceed").click()
    ui_utils.wait_for_spinner_to_disappear()
