# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Modals related to people administration (create, edit)."""
# pylint: disable=too-few-public-methods

from lib import base, decorator


class BasePersonModal(base.Modal):
  """Base modal window for people administration."""

  def __init__(self, driver):
    super(BasePersonModal, self).__init__(driver)
    self.modal = self._browser.div(class_name="modal-wide")
    self.modal_type_lbl = self.modal.div(class_name="modal-header")
    self.name_field = self.modal.text_field(id="person_name")
    self.email_field = self.modal.text_field(id="person_email")
    self.company_field = self.modal.text_field(id="person_company")

  @decorator.handle_alert
  def _save_and_close(self):
    """Click 'Save & Close' button."""
    self.modal.link(text="Save & Close").click()
    self.modal.wait_until_not(method=lambda e: e.present)

  def fill_and_submit_form(self, **kwargs):
    """Fill required fields and click on 'Save & Close' button
      on Person modal"""
    for field in kwargs:
      getattr(self, field + "_field").value = kwargs[field]
    self.name_field.click()
    self._save_and_close()


class UserRoleAssignmentsModal(base.Modal):
  """Modal window for editing person role."""

  def __init__(self, driver=None):
    super(UserRoleAssignmentsModal, self).__init__(driver)
    self.modal = self._browser.div(class_name="modal")

  def select_and_submit_role(self, role):
    """Click specified role to select it and save."""
    self.modal.label(text=role.capitalize()).click()
    self.modal.link(text="Save").click()
    self.modal.wait_until_not(method=lambda e: e.present)
