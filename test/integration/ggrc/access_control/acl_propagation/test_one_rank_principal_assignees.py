# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test Access Control roles Principal Assignees propagation"""

import ddt

from ggrc.models import all_models
from integration.ggrc.access_control import rbac_factories
from integration.ggrc.access_control.acl_propagation import base
from integration.ggrc.utils import helpers


@ddt.ddt
class TestPrincipalAssigneesPropagation(base.TestACLPropagation):
  """Test Principal Assignees role permissions propagation

  This tests are different from other ACR test in acr_propagation package
  because we map document to parent directly (one rank)
  e.g Control -> with document.Reference URL and check that
  Control's Principal Assignees can read/create etc document and its comments.
  """

  PERMISSIONS = {
      "Creator": {
          "Document Control": {
              "read": True,
              "create_and_map": True,
              "update": True,
              "delete": False,
              "read_comments": True,
              "add_comment": True
          }
      },
      "Reader": {
          "Document Control": {
              "read": True,
              "create_and_map": True,
              "update": True,
              "delete": False,
              "read_comments": True,
              "add_comment": True
          }
      },
  }

  def init_factory(self, role, model, parent):
    """Initialize RBAC factory with propagated Principal Assignees role.

    Args:
        role: Global Custom role that user have (Creator/Reader/Editor).
        model: Model name for which factory should be got.
        parent: Model name in scope of which objects should be installed.

    Returns:
        Initialized RBACFactory object.
    """
    self.setup_people()
    primary_contacts = all_models.AccessControlRole.query.filter_by(
        name="Principal Assignees",
        object_type=parent,
    ).first()
    rbac_factory = rbac_factories.TEST_FACTORIES_MAPPING[model]
    return rbac_factory(self.people[role].id, primary_contacts, parent)

  @helpers.unwrap(PERMISSIONS)
  def test_access(self, role, model, action_name, expected_result):
    """Principal Assignees {0:<7}: On {1:<20} test {2:<20} - Expect {3:<2} """
    self.runtest(role, model, action_name, expected_result)
