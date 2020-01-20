# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Threat UI facade."""
from lib import url
from lib.constants import objects
from lib.page import dashboard
from lib.ui import internal_ui_operations
from lib.utils import selenium_utils


def create_threat(threat):
  """Creates a threat `threat`."""
  selenium_utils.open_url(url.dashboard())
  dashboard.Dashboard().open_create_obj_modal(objects.get_singular(
      objects.THREATS, title=True))
  internal_ui_operations.submit_obj(threat)
