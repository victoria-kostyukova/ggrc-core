# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test access control propagation for Control."""

import ddt

from ggrc.models import all_models
from integration.ggrc.access_control import rbac_factories
from integration.ggrc.access_control.acl_propagation import base
from integration.ggrc.utils import helpers


@ddt.ddt
class TestControlRolesPropagation(base.TestACLPropagation):
  """Test Control roles permissions propagation."""

  PERMISSIONS = {
      "Creator": {
          "Universal Control": {
              "create_and_map_document": True,
              "read_document": True,
              "update_document": True,
              "delete_document": False,
              "create_and_map_comment": True,
              "read_comment": True,
              "create_and_map_document_comment": True,
              "read_document_comment": True,
          },
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
          "Universal Control": {
              "create_and_map_document": True,
              "read_document": True,
              "update_document": True,
              "delete_document": False,
              "create_and_map_comment": True,
              "read_comment": True,
              "create_and_map_document_comment": True,
              "read_document_comment": True,
          },
          "Document Control": {
              "read": True,
              "create_and_map": True,
              "update": True,
              "delete": False,
              "read_comments": True,
              "add_comment": True
          }
      },
      "Editor": {
          "Universal Control": {
              "create_and_map_document": True,
              "read_document": True,
              "update_document": True,
              "delete_document": False,
              "create_and_map_comment": True,
              "read_comment": True,
              "create_and_map_document_comment": True,
              "read_document_comment": True,
          },
      }
  }

  control_role = ""

  def init_factory(self, role, model, parent):
    """Initialize RBAC factory with propagated role.

    Args:
        role: Global Custom role that user have (Creator/Reader/Editor).
        model: Model name for which factory should be got.
        parent: Model name in scope of which objects should be installed.

    Returns:
        Initialized RBACFactory object.
    """
    self.setup_people()
    control_role = all_models.AccessControlRole.query.filter_by(
        name=self.control_role,
        object_type=parent,
    ).first()
    rbac_factory = rbac_factories.TEST_FACTORIES_MAPPING[model]
    return rbac_factory(self.people[role].id, control_role, parent)

  @helpers.unwrap(PERMISSIONS)
  def test_control_operatos_access(self, role, model, action_name,
                                   expected_result):
    """Test control operator role access."""
    self.control_role = "Control Operators"
    self.runtest(role, model, action_name, expected_result)

  @helpers.unwrap(PERMISSIONS)
  def test_control_owners_access(self, role, model, action_name,
                                 expected_result):
    """Test control owner role access."""
    self.control_role = "Control Owners"
    self.runtest(role, model, action_name, expected_result)

  @helpers.unwrap(PERMISSIONS)
  def test_control_other_contacts(self, role, model, action_name,
                                  expected_result):
    """Test Control Other Contacts access."""
    self.control_role = "Other Contacts"
    self.runtest(role, model, action_name, expected_result)
