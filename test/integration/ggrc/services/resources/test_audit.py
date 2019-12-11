# Copyright (C) 2019 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests for /api/audit endpoints."""

import json
import ddt

from ggrc.models import all_models
from integration.ggrc import api_helper
from integration.ggrc_basic_permissions.models \
    import factories as rbac_factories
from integration.ggrc.models import factories
from integration.ggrc.services import TestCase


@ddt.ddt
class TestAuditResource(TestCase):
  """Tests for special api endpoints."""

  def setUp(self):
    super(TestAuditResource, self).setUp()
    self.api = api_helper.Api()

  def _get_snapshots_count(self, object_id):
    """Get snapshots count for Audit with id {object_id}"""
    response = self.api.client.get(
        "/api/audits/{}/snapshot_counts".format(object_id),
    )
    return json.loads(response.data)

  def test_snapshot_counts_query(self):
    """Test snapshot_counts endpoint"""

    with factories.single_commit():
      audit_1 = factories.AuditFactory()
      control = factories.ControlFactory()
      regulation = factories.RegulationFactory()
      factories.RelationshipFactory(
          source=audit_1,
          destination=control
      )
      audit_2 = factories.AuditFactory()

    self._create_snapshots(audit_1, [control])
    self._create_snapshots(audit_2, [regulation])

    audits = [audit_1, audit_2]
    expected_snapshot_counts = {
        audit_1.id: {"Control": 1},
        audit_2.id: {"Regulation": 1},
    }

    for audit in audits:
      snapshot_counts = self._get_snapshots_count(audit.id)
      self.assertEqual(snapshot_counts, expected_snapshot_counts[audit.id])

  # pylint:disable=invalid-name
  def test_snapshot_counts_query_no_perm(self):
    """Test snapshot_counts endpoint counts only Snapshots that user has
    access to"""

    with factories.single_commit():
      audit = factories.AuditFactory()
      assmnt = factories.AssessmentFactory(audit=audit)
      factories.RelationshipFactory(source=audit, destination=assmnt)
      audit_id = audit.id

      # Create Global Creator and assign as Assignees
      user = factories.PersonFactory()
      reader_role = all_models.Role.query.filter(
          all_models.Role.name == "Creator").first()
      rbac_factories.UserRoleFactory(role=reader_role, person=user)
      acr = all_models.AccessControlRole.query.filter_by(
          name="Assignees",
          object_type=assmnt.type,
      ).first()
      factories.AccessControlPersonFactory(
          person_id=user.id,
          ac_list=assmnt.acr_acl_map[acr],
      )

      control_1 = factories.ControlFactory()
      control_2 = factories.ControlFactory()
      regulation = factories.RegulationFactory()
      factories.RelationshipFactory(
          source=audit,
          destination=control_1
      )

    snapshots = self._create_snapshots(audit, [control_1,
                                               control_2,
                                               regulation])
    factories.RelationshipFactory(
        source=assmnt,
        destination=snapshots[0]
    )

    self.api.set_user(user)

    expected_snapshot_counts = {
        audit_id: {"Control": 1},
    }

    snapshot_counts = self._get_snapshots_count(audit_id)
    self.assertEqual(expected_snapshot_counts[audit_id], snapshot_counts)
