# Copyright (C) 2020 Google Inc.
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


class TestProposalsDestructive(base.Test):
  """Tests for Proposals"""
  _data = None

  @pytest.fixture(scope="class")
  def obj_reader_role(self):
    """Create object role with only read permission."""
    return rest_facade.create_access_control_role(
        object_type="Program",
        read=True, update=False, delete=False)

  @pytest.fixture()
  def test_data(self, obj_reader_role, selenium):
    """Create 2 GC users.
    GC 1 creates object and adds GC 2 as a object reader.
    """
    if not self.__class__._data:
      obj_creator = rest_facade.create_user_with_role(roles.CREATOR)
      proposal_creator = rest_facade.create_user_with_role(roles.CREATOR)
      global_reader = rest_facade.create_user_with_role(roles.READER)
      users.set_current_user(obj_creator)
      obj_custom_roles = [
          (obj_reader_role.name, obj_reader_role.id,
           [proposal_creator])]
      obj = rest_facade.create_program(
          custom_roles=obj_custom_roles)
      users.set_current_user(proposal_creator)
      proposal_to_apply = proposal_ui_facade.create_proposal(selenium, obj)
      proposal_to_apply.datetime = (
          proposal_rest_service.ProposalsService().get_proposal_creation_date(
              obj, proposal_to_apply))
      proposal_to_decline = proposal_ui_facade.create_proposal(
          selenium, obj)
      proposal_to_decline.datetime = (
          proposal_rest_service.ProposalsService().get_proposal_creation_date(
              obj, proposal_to_decline))
      users.set_current_user(global_reader)
      proposal_from_gr = proposal_ui_facade.create_proposal(selenium, obj)
      proposal_from_gr.datetime = (
          proposal_rest_service.ProposalsService().get_proposal_creation_date(
              obj, proposal_from_gr))
      self.__class__._data = {"obj_creator": obj_creator,
                              "proposal_creator": proposal_creator,
                              "global_reader": global_reader,
                              "obj": obj,
                              "proposal_to_apply": proposal_to_apply,
                              "proposal_to_decline": proposal_to_decline,
                              "proposal_from_gr": proposal_from_gr}
    return self.__class__._data

  @classmethod
  def check_ggrc_6592_7562(cls, login_user, condition):
    """Check if it is xfail because of GGRC-6591(about proposal_creator) or
    GGRC-7562(about obj_creator) or fail."""
    if login_user in ["proposal_creator", "obj_creator"]:
      base.Test().check_xfail_or_fail(
          condition, "Issue GGRC-6592\n",
          "There are no proposals in the list from ui.")

  @pytest.mark.parametrize(
      "login_user",
      ["obj_creator", "global_reader", "proposal_creator"]
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
        selenium, test_data["obj"])
    self.check_ggrc_6592_7562(login_user, actual_proposals == exp_proposals)
    assert exp_proposals == actual_proposals

  @pytest.fixture()
  def apply_proposal(self, test_data, selenium):
    """Apply proposal."""
    if test_data["proposal_to_apply"].status == object_states.PROPOSED:
      users.set_current_user(test_data["obj_creator"])
      self.check_ggrc_6592_7562(
          "obj_creator",
          test_data["proposal_to_apply"] in
          proposal_ui_facade.get_related_proposals(selenium, test_data["obj"]))
      proposal_ui_facade.apply_proposal(
          selenium, test_data["obj"], test_data["proposal_to_apply"],
          [test_data["proposal_from_gr"], test_data["proposal_to_decline"]])

  @pytest.fixture()
  def decline_proposal(self, test_data, selenium):
    """Decline proposal."""
    if test_data["proposal_to_decline"].status == object_states.PROPOSED:
      users.set_current_user(test_data["obj_creator"])
      self.check_ggrc_6592_7562(
          "obj_creator",
          test_data["proposal_to_decline"] in
          proposal_ui_facade.get_related_proposals(selenium, test_data["obj"]))
      proposal_ui_facade.decline_proposal(
          selenium, test_data["obj"], test_data["proposal_to_decline"])

  @pytest.mark.parametrize(
      "login_user, apply_btns_exist",
      [("obj_creator", True), ("global_reader", False),
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
        selenium, test_data["obj"])
    self.check_ggrc_6592_7562(login_user, actual_proposals == exp_proposals)
    proposal_ui_facade.assert_proposal_apply_btns_exist(
        selenium, test_data["obj"], exp_proposals, apply_btns_exist)

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
        selenium, test_data["obj"], test_data[proposal],
        test_data[proposal_author])

  def test_check_proposals_comparison_window(
      self, test_data, selenium
  ):
    """Check if proposal comparison window has correct info."""
    users.set_current_user(test_data["obj_creator"])
    self.check_ggrc_6592_7562(
        "obj_creator",
        test_data["proposal_to_apply"] in
        proposal_ui_facade.get_related_proposals(selenium, test_data["obj"]))
    proposal_ui_facade.assert_proposal_comparison_window_has_correct_info(
        selenium, test_data["obj"], test_data["proposal_to_apply"])

  @pytest.mark.parametrize(
      "login_user",
      ["obj_creator", "global_reader", "proposal_creator"]
  )
  def test_check_proposals_applying(
      self, login_user, test_data, apply_proposal, selenium
  ):
    """Check if a proposal is applied."""
    users.set_current_user(test_data[login_user])
    actual_proposals = proposal_ui_facade.get_related_proposals(
        selenium, test_data["obj"])
    self.check_ggrc_6592_7562(
        login_user, test_data["proposal_to_apply"] in actual_proposals)
    assert test_data["proposal_to_apply"] in actual_proposals

  def test_check_proposals_apply_btn_after_applying(
      self, test_data, apply_proposal, selenium
  ):
    """Check an applied proposal apply button does not exist."""
    users.set_current_user(test_data["obj_creator"])
    self.check_ggrc_6592_7562(
        "obj_creator",
        (proposal_ui_facade.get_related_proposals(
            selenium, test_data["obj"]) ==
         [test_data["proposal_from_gr"], test_data["proposal_to_decline"],
          test_data["proposal_to_apply"]]))
    proposal_ui_facade.assert_proposal_apply_btns_exist(
        selenium, test_data["obj"], [test_data["proposal_to_apply"]],
        apply_btn_exists=False)

  @pytest.mark.parametrize(
      "login_user",
      ["obj_creator", "global_reader", "proposal_creator"]
  )
  def test_check_proposals_declining(
      self, login_user, test_data, decline_proposal, selenium
  ):
    """Check if a proposal is declined."""
    users.set_current_user(test_data[login_user])
    actual_proposals = proposal_ui_facade.get_related_proposals(
        selenium, test_data["obj"])
    self.check_ggrc_6592_7562(
        login_user,
        test_data["proposal_to_decline"] in actual_proposals)
    assert test_data["proposal_to_decline"] in actual_proposals

  def test_check_proposals_apply_btn_after_declining(
      self, test_data, decline_proposal, selenium
  ):
    """Check an applied proposal apply button does not exist."""
    users.set_current_user(test_data["obj_creator"])
    self.check_ggrc_6592_7562(
        "obj_creator",
        test_data["proposal_to_decline"] in
        proposal_ui_facade.get_related_proposals(selenium, test_data["obj"]))
    proposal_ui_facade.assert_proposal_apply_btns_exist(
        selenium, test_data["obj"], [test_data["proposal_to_decline"]],
        True)
