# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Services for create and manipulate Proposal objects via UI."""
# pylint: disable=invalid-name
# pylint: disable=too-many-lines
from lib import factory, base
from lib.constants import objects, object_states
from lib.entities import entities_factory
from lib.page.modal import apply_decline_proposal
from lib.page.widget import object_modal


class ProposalsService(base.WithBrowser):
  """Class for Proposals business layer's services objects."""

  def create_proposal(self, obj):
    """Create a proposal for an obj."""
    obj_info_page = factory.get_cls_webui_service(objects.get_plural(
        obj.type))(self._driver).open_info_page_of_obj(obj)
    obj_info_page.click_propose_changes()
    proposal_factory = entities_factory.ProposalsFactory()
    proposal = proposal_factory.create()
    proposed_description = proposal_factory.generate_string("Proposal")
    proposal_modal = object_modal.BaseObjectModal(self._driver)
    proposal_modal.set_description(proposed_description)
    proposal_modal.click_propose()
    proposal.changes = [{"obj_attr_type": "Description",
                         "cur_value": obj.description,
                         "proposed_value": proposed_description}]
    return proposal

  def open_obj_change_proposals_tab(self, obj):
    """Open change proposals tab of an obj."""
    obj_info_page = factory.get_cls_webui_service(objects.get_plural(
        obj.type))(self._driver).open_info_page_of_obj(obj)
    return obj_info_page.related_proposals()

  def get_related_proposals(self, obj):
    """Get related proposals."""
    return self.open_obj_change_proposals_tab(obj).get_proposals()

  def has_proposal_apply_btn(self, obj, proposal):
    """Check if proposal apply btn exists for an obj."""
    return self.open_obj_change_proposals_tab(obj).has_apply_btn(proposal)

  def assert_objs_diff_corresponds_to_proposal(self, obj, proposal):
    """Check if objs difference corresponds to the proposal."""
    self.open_obj_change_proposals_tab(obj).click_review_apply_btn(proposal)
    comparison_window = apply_decline_proposal.CompareApplyDeclineModal()
    comparison_window.modal.wait_until(lambda e: e.exists)
    obj_name = objects.get_plural(obj.type)
    service_cls = factory.get_cls_webui_service(obj_name)(self._driver)
    current_obj = service_cls.build_obj_from_page(
        comparison_window.curr_version_obj_root_elem.wait_until(
            lambda e: e.exists))
    obj_after_proposal = service_cls.build_obj_from_page(
        comparison_window.proposal_version_obj_root_elem.wait_until(
            lambda e: e.exists))
    actual_proposal = entities_factory.ProposalsFactory().create()
    proposal_obj_dict = obj_after_proposal.__dict__
    current_obj_dict = current_obj.__dict__
    actual_proposal.changes = []
    for key in obj_after_proposal.__dict__.keys():
      if proposal_obj_dict[key] != current_obj_dict[key]:
        actual_proposal.changes.append(
            {"obj_attr_type": key.title(),
             "cur_value": current_obj_dict[key],
             "proposed_value": proposal_obj_dict[key]})
    actual_proposal.author = comparison_window.get_proposal_version_author()
    actual_proposal.datetime = (
        comparison_window.get_proposal_version_datetime())
    comparison_window.click_cancel_btn()
    assert actual_proposal == proposal

  def apply_proposal(self, obj, proposal):
    """Apply an obj proposal."""
    self.open_obj_change_proposals_tab(obj).click_review_apply_btn(proposal)
    apply_decline_proposal.CompareApplyDeclineModal().click_apply_btn()
    proposal.status = object_states.APPLIED
    proposal.changes[0]["cur_value"] = proposal.changes[0]["proposed_value"]

  def decline_proposal(self, obj, proposal):
    """Decline an obj proposal."""
    self.open_obj_change_proposals_tab(obj).click_review_apply_btn(proposal)
    apply_decline_proposal.CompareApplyDeclineModal().click_decline_btn()
    proposal.status = object_states.DECLINED
