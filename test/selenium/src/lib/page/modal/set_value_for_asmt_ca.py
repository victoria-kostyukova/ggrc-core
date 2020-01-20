# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Modals for create objects."""

from lib import base


class SetValueForAsmtDropdown(base.Modal):
  """Modal for set value for assessment custom attribute."""

  def __init__(self, driver):
    super(SetValueForAsmtDropdown, self).__init__(driver)
    self.modal_elem = self._browser.div(class_name="in").div(
        class_name="simple-modal")
    self.modal_header_lbl = self.modal_elem.div(
        class_name="simple-modal__header-text")

  @property
  def comment_input(self):
    """Comment panel."""
    return base.CommentInput(self.modal_elem)

  @property
  def _save_button(self):
    """Save button."""
    return self.modal_elem.button(text="Save")

  @property
  def _close_button(self):
    """Close button."""
    return self.modal_elem.button(text="Close")

  def close_modal(self):
    """Click close button."""
    self._close_button.click()
    self._close_button.wait_until_not_present()

  def save(self):
    """Click save button."""
    self._save_button.click()
    self._save_button.wait_until_not_present()

  def set_dropdown_url(self, url):
    """Set evidence url via dropdown."""
    modal_url_root_element = self.modal_elem.div(text="Evidence url").parent(
        tag_name="div")
    modal_url_root_element.button(text="Add").click()
    modal_url_root_element.input().send_keys(url)
    modal_url_root_element.button(class_name="create-form__confirm").click()

  def fill_dropdown_lca(self, **kwargs):
    """Fill comment or url for Assessment dropdown."""
    if "url" in kwargs:
      self.set_dropdown_url(kwargs["url"])
    if "comment" in kwargs:
      self.comment_input.fill(kwargs["comment"])
      self.save()
    else:
      self.close_modal()
