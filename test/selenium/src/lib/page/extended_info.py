# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Extended Info Page models (visible in LHN on hover over object members)."""

from lib import base
from lib.constants import locator


class ExtendedInfo(base.Component):
  """Extended Info box that allow object to be mapped"""
  locator_cls = locator.ExtendedInfo

  def __init__(self, driver):
    super(ExtendedInfo, self).__init__(driver)
    self.title = base.Label(driver, self.locator_cls.TITLE)
