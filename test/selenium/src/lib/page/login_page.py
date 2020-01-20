# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Login page."""
# pylint: disable=too-few-public-methods

from lib import base


class LoginPage(base.Component):
  """Login page."""

  def __init__(self, root_element=None):
    super(LoginPage, self).__init__()
    if root_element:
      self._browser = root_element
    self.logo = self._browser.element(tag_name="h1", text="GGRC")
    self.description = self._browser.element(
        tag_name="h2", text="Governance, Risk and Compliance")
    self.login_button = self._browser.link(
        class_name="btn btn-large btn-lightBlue", text="Login")
    self.about = self._browser.link(class_name="about-link", text="About GGRC")

  def get_visible_elements(self):
    """Returns elements that are visible on the Login Page."""
    return [self.logo, self.description, self.login_button, self.about]
