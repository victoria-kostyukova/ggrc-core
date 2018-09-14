# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Tests for Proposals"""
# pylint: disable=no-self-use

import pytest

from lib import base, users
from lib.constants import roles, objects
from lib.decorator import memoize
from lib.entities import entities_factory
from lib.factory import get_cls_rest_service
from lib.service import rest_facade, webui_facade


class TestProposals(base.Test):
  """Tests for Proposals"""
  data = None

  @memoize
  @pytest.fixture(scope="class")
  def create_control_reader_role(self):
    """Create Control role with only read permission."""
    return rest_facade.create_access_control_role(
        object_type="Control",
        parent_type="Control",
        read=True, update=False, delete=False)

  @pytest.fixture()
  def test_data(self, create_control_reader_role, selenium):
    """Create 2 GC users.
    GC 1 create Control and add GC 2 as a control reader.
    """
    if not TestProposals.data:
      control_creator = rest_facade.create_user_with_role(roles.CREATOR)
      proposal_creator = rest_facade.create_user_with_role(roles.CREATOR)
      users.set_current_user(control_creator)
      control = rest_facade.create_control()
      role_id = roles.ACLRolesIDs.id_of_role(
          object_type=control.type, name=create_control_reader_role.name)
      get_cls_rest_service(objects.get_plural(control.type))().update_obj(
          obj=control,
          access_control_list=(
              control.access_control_list +
              entities_factory.PeopleFactory.get_acl_members(
                  role_id, [proposal_creator])))
      users.set_current_user(proposal_creator)
      proposal = webui_facade.create_proposal(selenium, control)
      TestProposals.data = {"control_creator": control_creator,
                            "proposal_creator": proposal_creator,
                            "control": control,
                            "proposal": proposal}
    return TestProposals.data

  @pytest.mark.parametrize(
      "login_user",
      ["control_creator",
       pytest.mark.xfail(reason="Issue GGRC-5091", strict=True)
          ("proposal_creator")]
  )
  def test_check_proposals(
      self, login_user, test_data, selenium
  ):
    """Check proposal creation on Change Proposal tab."""
    users.set_current_user(test_data[login_user])
    webui_facade.assert_proposal_is_created(
        selenium, test_data["control"], test_data["proposal"])

  @pytest.mark.parametrize(
      "login_user, apply_btn_exists",
      [("control_creator", True),
       pytest.mark.xfail(reason="Issue GGRC-5091", strict=True)
          (("proposal_creator", False))
       ]
  )
  def test_check_proposals_apply_btn(
      self, login_user, apply_btn_exists, test_data, selenium
  ):
    """Check proposal apply button exists for proposal recipient and does
    not exist for proposal creator."""
    users.set_current_user(test_data[login_user])
    webui_facade.assert_proposal_apply_btn_exists(
        selenium, test_data["control"], test_data["proposal"],
        apply_btn_exists)

  def test_check_proposal_email_connects_to_correct_obj(
      self, test_data, selenium
  ):
    """Check if proposal notification email connects to the correct obj."""
    # pylint: disable=invalid-name
    users.set_current_user(users.FakeSuperUser)
    webui_facade.assert_proposal_notification_connects_to_obj(
        selenium, test_data["control"], test_data["proposal"])
