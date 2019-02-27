# Copyright (C) 2019 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Mixins for info page objects"""
# pylint: disable=too-few-public-methods

from lib import base
from lib.element import page_elements
from lib.utils import selenium_utils


class WithPageElements(base.WithBrowser):
  """A mixin for page elements"""

  def _related_people_list(self, label, root_elem=None):
    """Return RelatedPeopleList page element with label `label`"""
    return page_elements.RelatedPeopleList(
        root_elem if root_elem else self._browser, label)

  def _related_urls(self, label, root_elem=None):
    """Return RelatedUrls page element with label `label`"""
    return page_elements.RelatedUrls(
        root_elem if root_elem else self._browser, label)

  def _assessment_evidence_urls(self):
    """Return AssessmentEvidenceUrls page element"""
    return page_elements.AssessmentEvidenceUrls(self._browser)

  def _comment_area(self):
    """Return CommentArea page element"""
    return page_elements.CommentArea(self._browser)

  def _simple_field(self, label, root_elem=None):
    """Returns SimpleField page element."""
    return page_elements.SimpleField(
        root_elem if root_elem else self._browser, label)

  def _info_pane_form_field(self, label):
    """Returns InfoPaneFormField page element."""
    return page_elements.InfoPaneFormField(self._browser, label)

  def _assessment_form_field(self, label):
    """Returns AssessmentFormField page element."""
    return page_elements.AssessmentFormField(self._browser, label)


class WithAssignFolder(base.WithBrowser):
  """A mixin for `Assign Folder`"""

  def __init__(self, driver):
    super(WithAssignFolder, self).__init__(driver)
    self.assign_folder_button = self._browser.element(
        class_name="mapped-folder__add-button")


class WithObjectReview(base.WithBrowser):
  """A mixin for object reviews"""

  def __init__(self, driver=None):
    super(WithObjectReview, self).__init__(driver)

  @property
  def _review_root(self):
    return self._browser.element(class_name="object-review")

  @property
  def request_review_btn(self):
    return self._review_root.button(text="Request Review")

  @property
  def mark_reviewed_btn(self):
    return self._review_root.element(text="Mark Reviewed")

  @property
  def review_status(self):
    return self._review_root.element(class_name="state-value")

  def open_submit_for_review_popup(self):
    """Open submit for control popup by clicking on corresponding button."""
    self.request_review_btn.click()
    selenium_utils.wait_for_js_to_load(self._driver)

  def click_approve_review(self):
    """Click approve review button."""
    self.mark_reviewed_btn.click()

  def has_review(self):
    """Check if review section exists."""
    return self._review_root.exists

  def get_review_status(self):
    """Get review status."""
    return self.review_status.text.title()
