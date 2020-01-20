# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests for /api/audit endpoints."""

import json
import ddt

from ggrc.models import all_models
from integration.ggrc import api_helper
from integration.ggrc.models import factories
from integration.ggrc.services import TestCase


@ddt.ddt
class TestAuditResource(TestCase):
  """Tests for special api endpoints."""

  def setUp(self):
    super(TestAuditResource, self).setUp()
    self.api = api_helper.Api()

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

    with factories.single_commit():
      revision = all_models.Revision.query.filter(
          all_models.Revision.resource_type == "Audit",
          all_models.Revision.resource_id == audit_1.id
      ).first()
      revision_2 = all_models.Revision.query.filter(
          all_models.Revision.resource_type == "Audit",
          all_models.Revision.resource_id == audit_2.id
      ).first()
      snapshot = factories.SnapshotFactory(
          parent=audit_1,
          child_type=control.type,
          child_id=control.id,
          revision=revision
      )
      factories.RelationshipFactory(
          source=audit_1,
          destination=snapshot,
      )
      snapshot2 = factories.SnapshotFactory(
          parent=audit_2,
          child_type=regulation.type,
          child_id=regulation.id,
          revision=revision_2
      )
      factories.RelationshipFactory(
          source=audit_2,
          destination=snapshot2,
      )

    audits = [audit_1, audit_2]
    expected_snapshot_counts = {
        audit_1.id: {"Control": 1},
        audit_2.id: {"Regulation": 1},
    }

    for audit in audits:
      response = self.api.client.get(
          "/api/audits/{}/snapshot_counts".format(audit.id),
      )
      snapshot_counts = json.loads(response.data)
      self.assertEqual(snapshot_counts, expected_snapshot_counts[audit.id])
