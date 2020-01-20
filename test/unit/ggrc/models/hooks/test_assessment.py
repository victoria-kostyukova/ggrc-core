# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test assessment hooks."""

import unittest

import ddt
import mock

from ggrc.models.hooks import assessment as asmt_hooks


@ddt.ddt
class TestFromSession(unittest.TestCase):
  """Test session-listener wrapper.

  Models are substituted with builtin types as they can be used for
  isinstance checks too.
  """

  def setUp(self):
    super(TestFromSession, self).setUp()
    self.session = mock.Mock()

  @ddt.data(
      ([], {'Auditors': [], 'Audit Lead': []}),
      (
          [{"ac_role_id": 5, "person_id": 1}],
          {'Auditors': [], 'Audit Lead': []}
      ),
      (
          [{"ac_role_id": 1, "person_id": 1}],
          {'Auditors': [1], 'Audit Lead': []}
      ),
      (
          [
              {"ac_role_id": 1, "person_id": 1},
              {"ac_role_id": 5, "person_id": 2},
              {"ac_role_id": 6, "person_id": 3},
          ],
          {'Auditors': [1], 'Audit Lead': []},
      ),
  )
  @ddt.unpack
  def test_generate_role_people_map(self, content_acl, expected):
    """Generate role object should not fail on a missing role for

    This test checks that any role can be missing and the roles dict is still
    returned. This is okay if the missing roles are editable, this test does
    not check that we actually can't remove non-editable roles.
    """
    mock_path = "ggrc.access_control.role.get_custom_roles_for"
    with mock.patch(mock_path) as roles_mock:
      roles_mock.return_value = {
          1: "Auditors",
          2: "Audit Captains",
      }
      asmt_hooks.logger = mock.MagicMock()
      audit = mock.MagicMock()
      audit.access_control_list = []
      snapshot = mock.MagicMock()
      snapshot.revision.content = {
          "access_control_list": content_acl,
      }
      # pylint: disable=protected-access
      acl_dict = asmt_hooks._generate_role_people_map(
          audit, snapshot, snapshot.revision.content)
      self.assertEqual(acl_dict, expected)

  def test_missing_snapshot_plan(self):
    """Test copy_snapshot_plan when test_plan is missing from revision."""
    asmt = mock.MagicMock(test_plan="Initial Test Plan.")
    asmt_test_plan_before = asmt.test_plan
    snapshot_rev_content = {}

    asmt_hooks.set_test_plan(
        assessment=asmt,
        template=None,
        snapshot_rev_content=snapshot_rev_content,
    )

    self.assertEqual(asmt_test_plan_before, asmt.test_plan)
