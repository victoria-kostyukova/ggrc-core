# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test Access Control roles Program Readers propagation"""

import ddt

from ggrc.models import all_models
from integration.ggrc.access_control import rbac_factories
from integration.ggrc.access_control.acl_propagation import base
from integration.ggrc.utils import helpers


@ddt.ddt
class TestProgramReadersPropagation(base.TestACLPropagation):
  """Test Program Readers role permissions propagation"""

  PERMISSIONS = {
      "Creator": {
          "Program": {
              "read": True,
              "update": False,
              "delete": False,
              "read_revisions": True,
              "map_control": False,
              "unmap_control": False,
              "read_mapped": True,
              "update_mapped": False,
              "delete_mapped": False,
          },
          "Audit": {
              "read": True,
              "update": False,
              "delete": False,
              "clone": False,
              "read_revisions": True,
              "map_control": False,
              "deprecate": False,
              "archive": False,
              "unarchive": False,
              "summary": True,
          },
          "Assessment": {
              "create": False,
              "generate": False,
              "read": True,
              "update": False,
              "delete": False,
              "read_revisions": True,
              "map_snapshot": False,
              "deprecate": False,
              "map_comment": False,
              "map_evidence": False,
              "related_assessments": True,
              "related_objects": True,
              "complete": False,
              "in_progress": False,
              "not_started": False,
              "decline": False,
              "verify": False,
          },
          "AssessmentTemplate": {
              "create": False,
              "read": True,
              "update": False,
              "delete": False,
              "read_revisions": True,
          },
          "Snapshot Assessment": {
              "read": True,
              "read_original": True,
              "update": False,
              "get_latest_version": True,
          },
          "Snapshot Audit": {
              "read": True,
              "read_original": True,
              "update": False,
              "get_latest_version": True,
          },
          "Issue Assessment": {
              "read": True,
              "update": False,
              "delete": False,
              "read_revisions": True,
              "map": False,
              "create_and_map": False,
              "raise_issue": (False, "unimplemented"),
              "unmap": False,
          },
          "Issue Audit": {
              "read": True,
              "update": False,
              "delete": False,
              "read_revisions": True,
              "map": False,
              "create_and_map": False,
              "unmap": False,
          },
          "Evidence Audit": {
              "create_and_map": False,
              "read": True,
              "update": False,
              "delete": False,
              "add_comment": False,
              "read_comments": True
          },
          "Evidence Assessment": {
              "create_and_map": False,
              "read": True,
              "update": False,
              "delete": False,
              "add_comment": False,
              "read_comments": True
          },
          "Document Program": {
              "read": True,
              "create_and_map": False,
              "update": False,
              "delete": False,
              "read_comments": True,
              "add_comment": False
          },
          "MappedReview Program": {
              "create_review": True,
              "read_review": True,
              "update_review": False,
              "delete_review": False,
          },
      },
      "Reader": {
          "Program": {
              "read": True,
              "update": False,
              "delete": False,
              "read_revisions": True,
              "map_control": False,
              "unmap_control": False,
              "read_mapped": True,
              "update_mapped": False,
              "delete_mapped": False,
          },
          "Audit": {
              "read": True,
              "update": False,
              "delete": False,
              "clone": False,
              "read_revisions": True,
              "map_control": False,
              "deprecate": False,
              "archive": False,
              "unarchive": False,
              "summary": True,
          },
          "Assessment": {
              "create": False,
              "generate": False,
              "read": True,
              "update": False,
              "delete": False,
              "read_revisions": True,
              "map_snapshot": False,
              "deprecate": False,
              "map_comment": False,
              "map_evidence": False,
              "related_assessments": True,
              "related_objects": True,
              "complete": False,
              "in_progress": False,
              "not_started": False,
              "decline": False,
              "verify": False,
          },
          "AssessmentTemplate": {
              "create": False,
              "read": True,
              "update": False,
              "delete": False,
              "read_revisions": True,
          },
          "Snapshot Assessment": {
              "read": True,
              "read_original": True,
              "update": False,
              "get_latest_version": True,
          },
          "Snapshot Audit": {
              "read": True,
              "read_original": True,
              "update": False,
              "get_latest_version": True,
          },
          "Issue Assessment": {
              "read": True,
              "update": False,
              "delete": False,
              "read_revisions": True,
              "map": False,
              "create_and_map": False,
              "raise_issue": (False, "unimplemented"),
              "unmap": False,
          },
          "Issue Audit": {
              "read": True,
              "update": False,
              "delete": False,
              "read_revisions": True,
              "map": False,
              "create_and_map": False,
              "unmap": False,
          },
          "Evidence Audit": {
              "create_and_map": False,
              "read": True,
              "update": False,
              "delete": False,
              "add_comment": False,
              "read_comments": True
          },
          "Evidence Assessment": {
              "create_and_map": False,
              "read": True,
              "update": False,
              "delete": False,
              "add_comment": False,
              "read_comments": True
          },
          "Document Program": {
              "read": True,
              "create_and_map": False,
              "update": False,
              "delete": False,
              "read_comments": True,
              "add_comment": False
          },
          "MappedReview Program": {
              "create_review": True,
              "read_review": True,
              "update_review": False,
              "delete_review": False,
          },
      },
      "Editor": {
          "Program": {
              "create": True,
              "read": True,
              "update": True,
              "delete": True,
              "read_revisions": True,
              "map_control": True,
              "unmap_control": True,
              "read_mapped": True,
              "update_mapped": True,
              "delete_mapped": True,
          },
          "Audit": {
              "read": True,
              "update": True,
              "delete": True,
              "clone": True,
              "read_revisions": True,
              "map_control": True,
              "deprecate": True,
              "archive": False,
              "unarchive": (False, "unimplemented"),
              "summary": True,
          },
          "Assessment": {
              "create": True,
              "generate": True,
              "read": True,
              "update": True,
              "delete": True,
              "read_revisions": True,
              "map_snapshot": True,
              "deprecate": True,
              "map_comment": True,
              "map_evidence": True,
              "related_assessments": True,
              "related_objects": True,
              "complete": True,
              "in_progress": True,
              "not_started": True,
              "decline": (False, "unimplemented"),
              "verify": (False, "unimplemented"),
          },
          "AssessmentTemplate": {
              "create": True,
              "read": True,
              "update": True,
              "delete": True,
              "read_revisions": True,
          },
          "Snapshot Assessment": {
              "read": True,
              "read_original": True,
              "update": True,
              "get_latest_version": True,
          },
          "Snapshot Audit": {
              "read": True,
              "read_original": True,
              "update": True,
              "get_latest_version": True,
          },
          "Issue Assessment": {
              "read": True,
              "update": True,
              "delete": True,
              "read_revisions": True,
              "map": True,
              "create_and_map": True,
              "raise_issue": True,
              "unmap": True,
          },
          "Issue Audit": {
              "read": True,
              "update": True,
              "delete": True,
              "read_revisions": True,
              "map": True,
              "create_and_map": True,
              "unmap": True,
          },
          "Evidence Audit": {
              "create_and_map": True,
              "read": True,
              "update": True,
              "delete": False,
              "add_comment": True,
              "read_comments": True
          },
          "Evidence Assessment": {
              "create_and_map": True,
              "read": True,
              "update": True,
              "delete": False,
              "add_comment": True,
              "read_comments": True
          },
          "Document Program": {
              "read": True,
              "create_and_map": True,
              "update": True,
              "delete": False,
              "read_comments": True,
              "add_comment": True
          },
          "MappedReview Program": {
              "create_review": True,
              "read_review": True,
              "update_review": False,
              "delete_review": False,
          },
      },
  }

  def init_factory(self, role, model, parent):
    """Initialize RBAC factory with propagated Program Readers role.

    Args:
        role: Global Custom role that user have (Creator/Reader/Editor).
        model: Model name for which factory should be got.
        parent: Model name in scope of which objects should be installed.

    Returns:
        Initialized RBACFactory object.
    """
    self.setup_people()
    program_reader_acr = all_models.AccessControlRole.query.filter_by(
        name="Program Readers",
        object_type="Program",
    ).first()

    rbac_factory = rbac_factories.TEST_FACTORIES_MAPPING[model]
    return rbac_factory(self.people[role].id, program_reader_acr, parent)

  @helpers.unwrap(PERMISSIONS)
  def test_access(self, role, model, action_name, expected_result):
    """Program Readers {0:<7}: On {1:<20} test {2:<20} - Expected {3:<2} """
    self.runtest(role, model, action_name, expected_result)
