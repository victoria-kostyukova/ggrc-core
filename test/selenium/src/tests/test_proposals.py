# Copyright (C) 2019 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Tests for Proposals"""
# pylint: disable=invalid-name
# pylint: disable=no-self-use
# pylint: disable=unused-argument
# pylint: disable=protected-access
import pytest

from lib import base, users
from lib.constants import roles, object_states
from lib.service import rest_facade, proposal_ui_facade, proposal_rest_service


@pytest.mark.skipif(reason="Proposals are temporarily unavailable.")
class TestProposalsDestructive(base.Test):
  """Tests for Proposals"""
  _data = None

  @pytest.fixture(scope="class")
  def risk_reader_role(self):
    """Create risk role with only read permission."""
    return rest_facade.create_access_control_role(
        object_type="Risk",
        read=True, update=False, delete=False)

  @pytest.fixture()
  def test_data(self, risk_reader_role, selenium):
    """Create 2 GC users.
    GC 1 creates risk and adds GC 2 as a risk reader.
    """
    if not self.__class__._data:
      risk_creator = rest_facade.create_user_with_role(roles.CREATOR)
      proposal_creator = rest_facade.create_user_with_role(roles.CREATOR)
      global_reader = rest_facade.create_user_with_role(roles.READER)
      users.set_current_user(risk_creator)
      risk_custom_roles = [
          (risk_reader_role.name, risk_reader_role.id,
           [proposal_creator])]
      risk = rest_facade.create_risk(
          custom_roles=risk_custom_roles)
      users.set_current_user(proposal_creator)
      proposal_to_apply = proposal_ui_facade.create_proposal(selenium, risk)
      proposal_to_apply.datetime = (
          proposal_rest_service.ProposalsService().get_proposal_creation_date(
              risk, proposal_to_apply))
      proposal_to_decline = proposal_ui_facade.create_proposal(
          selenium, risk)
      proposal_to_decline.datetime = (
          proposal_rest_service.ProposalsService().get_proposal_creation_date(
              risk, proposal_to_decline))
      users.set_current_user(global_reader)
      proposal_from_gr = proposal_ui_facade.create_proposal(selenium, risk)
      proposal_from_gr.datetime = (
          proposal_rest_service.ProposalsService().get_proposal_creation_date(
              risk, proposal_from_gr))
      self.__class__._data = {"risk_creator": risk_creator,
                              "proposal_creator": proposal_creator,
                              "global_reader": global_reader,
                              "risk": risk,
                              "proposal_to_apply": proposal_to_apply,
                              "proposal_to_decline": proposal_to_decline,
                              "proposal_from_gr": proposal_from_gr}
    return self.__class__._data

  @pytest.fixture()
  def apply_proposal(self, test_data, selenium):
    """Apply proposal."""
    if test_data["proposal_to_apply"].status == object_states.PROPOSED:
      users.set_current_user(test_data["risk_creator"])
      proposal_ui_facade.apply_proposal(
          selenium, test_data["risk"], test_data["proposal_to_apply"],
          [test_data["proposal_from_gr"], test_data["proposal_to_decline"]])

  @pytest.fixture()
  def decline_proposal(self, test_data, selenium):
    """Decline proposal."""
    if test_data["proposal_to_decline"].status == object_states.PROPOSED:
      users.set_current_user(test_data["risk_creator"])
      proposal_ui_facade.decline_proposal(
          selenium, test_data["risk"], test_data["proposal_to_decline"])

  @classmethod
  def check_ggrc_6591(cls, login_user, condition):
    """Check if it is xfail because of GGRC-6591 or fail."""
    if login_user == "proposal_creator":
      base.Test().check_xfail_or_fail(
          condition, "Issue GGRC-6591\n",
          "There are no proposals in the list from ui.")

  @pytest.mark.parametrize(
      "login_user",
      ["risk_creator", "global_reader", "proposal_creator"]
  )
  def test_check_proposals(
      self, login_user, test_data, selenium
  ):
    """Check proposal is created on Change Proposal tab."""
    users.set_current_user(test_data[login_user])
    exp_proposals = [
        test_data["proposal_from_gr"], test_data["proposal_to_decline"],
        test_data["proposal_to_apply"]]
    actual_proposals = proposal_ui_facade.get_related_proposals(
        selenium, test_data["risk"])
    self.check_ggrc_6591(login_user, actual_proposals == exp_proposals)
    assert exp_proposals == actual_proposals

  @pytest.mark.parametrize(
      "login_user, apply_btns_exist",
      [("risk_creator", True), ("global_reader", False),
       ("proposal_creator", False)]
  )
  def test_check_proposals_apply_btn(
      self, login_user, apply_btns_exist, test_data, selenium
  ):
    """Check proposal apply buttons exist for proposal recipient and do
    not exist for proposal creators."""
    users.set_current_user(test_data[login_user])
    exp_proposals = [
        test_data["proposal_from_gr"], test_data["proposal_to_decline"],
        test_data["proposal_to_apply"]]
    actual_proposals = proposal_ui_facade.get_related_proposals(
        selenium, test_data["risk"])
    self.check_ggrc_6591(login_user, actual_proposals == exp_proposals)
    proposal_ui_facade.assert_proposal_apply_btns_exist(
        selenium, test_data["risk"], exp_proposals, apply_btns_exist)

  @pytest.mark.parametrize(
      "proposal, proposal_author",
      [("proposal_to_apply", "proposal_creator"),
       ("proposal_from_gr", "global_reader")]
  )
  def test_check_proposals_email_connects_to_correct_obj(
      self, test_data, proposal, proposal_author, selenium
  ):
    """Check if proposal notification email connects to the correct obj."""
    users.set_current_user(users.FAKE_SUPER_USER)
    proposal_ui_facade.assert_proposal_notification_connects_to_obj(
        selenium, test_data["risk"], test_data[proposal],
        test_data[proposal_author])

  def test_check_proposals_comparison_window(
      self, test_data, selenium
  ):
    """Check if proposal comparison window has correct info."""
    users.set_current_user(test_data["risk_creator"])
    proposal_ui_facade.assert_proposal_comparison_window_has_correct_info(
        selenium, test_data["risk"], test_data["proposal_to_apply"])

  @pytest.mark.parametrize(
      "login_user",
      ["risk_creator", "global_reader", "proposal_creator"]
  )
  def test_check_proposals_applying(
      self, login_user, test_data, apply_proposal, selenium
  ):
    """Check if a proposal is applied."""
    users.set_current_user(test_data[login_user])
    actual_proposals = proposal_ui_facade.get_related_proposals(
        selenium, test_data["risk"])
    assert test_data["proposal_to_apply"] in actual_proposals

  def test_check_proposals_apply_btn_after_applying(
      self, test_data, apply_proposal, selenium
  ):
    """Check an applied proposal apply button does not exist."""
    users.set_current_user(test_data["risk_creator"])
    proposal_ui_facade.assert_proposal_apply_btns_exist(
        selenium, test_data["risk"], [test_data["proposal_to_apply"]],
        False)

  @pytest.mark.parametrize(
      "login_user",
      ["risk_creator", "global_reader", "proposal_creator"]
  )
  def test_check_proposals_declining(
      self, login_user, test_data, decline_proposal, selenium
  ):
    """Check if a proposal is declined."""
    users.set_current_user(test_data[login_user])
    actual_proposals = proposal_ui_facade.get_related_proposals(
        selenium, test_data["risk"])
    assert test_data["proposal_to_decline"] in actual_proposals

  def test_check_proposals_apply_btn_after_declining(
      self, test_data, decline_proposal, selenium
  ):
    """Check an applied proposal apply button does not exist."""
    users.set_current_user(test_data["risk_creator"])
    proposal_ui_facade.assert_proposal_apply_btns_exist(
        selenium, test_data["risk"], [test_data["proposal_to_decline"]],
        True)
