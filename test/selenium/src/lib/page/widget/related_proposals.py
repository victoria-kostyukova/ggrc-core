# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Related proposals."""
# pylint: disable=useless-super-delegation
from lib import base
from lib.entities import entity


class RelatedProposals(base.WithBrowser):
  """Related proposals."""

  def __init__(self, driver):
    super(RelatedProposals, self).__init__(driver)

  def is_related_proposals_empty(self):
    """Check if related proposals is empty."""
    return self._browser.element(class_name="object-list__item-empty").exists

  def get_proposals(self):
    """Get proposal rows."""
    proposal_rows = []
    elements = self._browser.elements(
        xpath="//div[@class='object-list__item ']")
    if not self.is_related_proposals_empty():
      for element in elements:
        proposal_rows.append(
            ProposalRow(row_element=element).get_proposal())
    return proposal_rows

  def apply_btn_existing_by_index(self, index):
    """Check if apply button with index exists."""
    element = self._browser.elements(
        xpath="//div[@class='object-list__item ']")[index]
    return ProposalRow(row_element=element).review_apply_btn_exists()


class ProposalRow(object):
  """Proposal rows."""

  def __init__(self, row_element):
    self.row_element = row_element

  def get_proposal(self):
    """Get proposal."""
    return entity.ProposalEntity(
        status=self.get_status(), author=self.get_author(),
        changes=self.get_changes(),
        comment=self.get_comment())

  def get_status(self):
    """Get proposal status."""
    return self.row_element.element(class_name="state-proposed").text

  def get_author(self):
    """Get proposal author."""
    return self.row_element.element(
        class_name="object-history__author-info").text.split(' ')[2]

  def get_datetime(self):
    """Get proposal datetime."""
    return self.row_element.element(
        class_name="object-history__author-info").text.splitlines()[3]

  def get_changes(self):
    """Get proposal changes."""
    changes_keys = ["obj_attr_type", "cur_value", "proposed_value"]
    changes_values_list = [
        element.text.splitlines() for element in self.row_element.elements(
            class_name="object-history__row--attributes")]
    for changes in changes_values_list:
      for change in changes:
        if change == u'\u2014':
          changes[changes.index(change)] = None
    return [{k: v for k, v in zip(changes_keys, changes_values)} for
            changes_values in changes_values_list]

  def get_comment(self):
    """Get proposal comment."""
    comment = self.row_element.element(
        xpath=("//related-proposals-item/div[@class='flex-size-1 "
               "object-history__attr']")).text
    return None if comment == "" else comment

  def review_apply_btn_exists(self):
    """Check if proposal Review&Apply button exists."""
    return self.row_element.element(tag_name="button").exists
