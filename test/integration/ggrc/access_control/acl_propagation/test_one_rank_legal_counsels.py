# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test Access Control roles Legal Counsels propagation"""

import ddt

from ggrc.models import all_models
from integration.ggrc.access_control import rbac_factories
from integration.ggrc.access_control.acl_propagation import base
from integration.ggrc.utils import helpers


@ddt.ddt
class TestLegalCounselsPropagation(base.TestACLPropagation):
  """Test Legal Counsels role permissions propagation

  This tests are different from other ACR test in acr_propagation package
  because we map document to parent directly (one rank)
  e.g Control -> with document.Reference URL and check that
  Control's Admin can read/create etc document and its comments.
  """

  PERMISSIONS = {
      "Creator": {
          "Universal KeyReport": {
              "create_and_map_document": True,
              "read_document": True,
              "update_document": True,
              "delete_document": False,
              "create_and_map_comment": True,
              "read_comment": True,
              "create_and_map_document_comment": True,
              "read_document_comment": True,
          },
          "Universal AccountBalance": {
              "create_and_map_document": True,
              "read_document": True,
              "update_document": True,
              "delete_document": False,
              "create_and_map_comment": True,
              "read_comment": True,
              "create_and_map_document_comment": True,
              "read_document_comment": True,
          },
      },
      "Reader": {
          "Universal KeyReport": {
              "create_and_map_document": True,
              "read_document": True,
              "update_document": True,
              "delete_document": False,
              "create_and_map_comment": True,
              "read_comment": True,
              "create_and_map_document_comment": True,
              "read_document_comment": True,
          },
          "Universal AccountBalance": {
              "create_and_map_document": True,
              "read_document": True,
              "update_document": True,
              "delete_document": False,
              "create_and_map_comment": True,
              "read_comment": True,
              "create_and_map_document_comment": True,
              "read_document_comment": True,
          },
      },
      "Editor": {
          "Universal KeyReport": {
              "create_and_map_document": True,
              "read_document": True,
              "update_document": True,
              "delete_document": False,
              "create_and_map_comment": True,
              "read_comment": True,
              "create_and_map_document_comment": True,
              "read_document_comment": True,
          },
          "Universal AccountBalance": {
              "create_and_map_document": True,
              "read_document": True,
              "update_document": True,
              "delete_document": False,
              "create_and_map_comment": True,
              "read_comment": True,
              "create_and_map_document_comment": True,
              "read_document_comment": True,
          },
      },
  }

  def init_factory(self, role, model, parent):
    """Initialize RBAC factory with propagated Legal Counsels role.

    Args:
        role: Global Custom role that user have (Creator/Reader/Editor).
        model: Model name for which factory should be got.
        parent: Model name in scope of which objects should be installed.

    Returns:
        Initialized RBACFactory object.
    """
    self.setup_people()
    legal_counsels = all_models.AccessControlRole.query.filter_by(
        name="Legal Counsels",
        object_type=parent,
    ).first()
    rbac_factory = rbac_factories.TEST_FACTORIES_MAPPING[model]
    return rbac_factory(self.people[role].id, legal_counsels, parent)

  @helpers.unwrap(PERMISSIONS)
  def test_access(self, role, model, action_name, expected_result):
    """Legal Counsels {0:<7}: On {1:<20} test {2:<20} - Expected {3:<2} """
    self.runtest(role, model, action_name, expected_result)
