# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Facade for Proposal UI services"""
# pylint: disable=invalid-name
import copy

from lib import base
from lib.entities import entity
from lib.page import fast_emails_digest
from lib.service import proposal_ui_service, emails_digest_service


def create_proposal(selenium, obj):
  """Create a proposal to obj."""
  return proposal_ui_service.ProposalsService(selenium).create_proposal(obj)


def apply_proposal(selenium, obj, proposal_to_apply, proposals_to_change):
  """Apply an obj proposal."""
  proposal_service = proposal_ui_service.ProposalsService(selenium)
  proposal_service.apply_proposal(obj, proposal_to_apply)
  change = proposal_to_apply.changes[0]
  # after applying the proposal obj attr is changed and every proposals to this
  # obj attr should change cur_value
  obj.__dict__[change["obj_attr_type"].lower()] = change["cur_value"]
  for proposal_to_change in proposals_to_change:
    proposal_to_change.changes[0]["cur_value"] = change["cur_value"]


def decline_proposal(selenium, obj, proposal):
  """Decline an obj proposal."""
  proposal_service = proposal_ui_service.ProposalsService(selenium)
  proposal_service.decline_proposal(obj, proposal)


def get_related_proposals(selenium, obj):
  """Get related proposals."""
  return proposal_ui_service.ProposalsService(
      selenium).get_related_proposals(obj)


def get_expected_proposal_email(obj, proposal, proposal_author):
  """Get proposal email."""
  proposal_copy = copy.deepcopy(proposal)
  for change in proposal_copy.changes:
    change.pop("cur_value", None)
  person_name = proposal_author.name
  expected_email = entity.ProposalEmailUI(
      # program obj has managers instead of admins
      recipient_email=obj.managers[0], author=person_name,
      obj_type=obj.type.lower(), changes=proposal_copy.changes,
      comment=proposal_copy.comment)
  return expected_email


def assert_proposal_apply_btns_exist(
    selenium, obj, proposals, apply_btn_exists
):
  """Check proposal apply buttons existence."""
  actual_apply_btns_existence = [
      proposal_ui_service.ProposalsService(
          selenium).has_proposal_apply_btn(obj, proposal)
      for proposal in proposals]
  exp_apply_btns_existence = [apply_btn_exists] * len(proposals)
  assert exp_apply_btns_existence == actual_apply_btns_existence


def assert_proposal_notification_connects_to_obj(
    selenium, obj, proposal, proposal_author
):
  """Check if proposal notification email exists and lead to the
  correspondent obj info page."""
  proposal_digest_service = (
      emails_digest_service.ProposalDigestService(selenium))
  proposal_digest_service.open_emails_digest()
  proposal_email = get_expected_proposal_email(obj, proposal, proposal_author)
  assert (proposal_email in
          fast_emails_digest.FastEmailsDigest().get_proposal_emails())
  actual_obj = proposal_digest_service.opened_obj(obj, proposal_email)
  # when proposals are added, comments for them are not added to `obj`
  actual_obj.comments = None
  base.Test.general_equal_assert(
      copy.deepcopy(obj).repr_ui(), actual_obj,
      "modified_by", *entity.Representation.tree_view_attrs_to_exclude)


def assert_proposal_comparison_window_has_correct_info(
    selenium, obj, proposal
):
  """Check if proposal comparison window has correct info."""
  proposal_ui_service.ProposalsService(
      selenium).assert_objs_diff_corresponds_to_proposal(obj, proposal)
