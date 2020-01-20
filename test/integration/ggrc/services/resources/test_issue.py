# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests for /api/issues endpoints."""

import json
import ddt

from ggrc.models import all_models
from integration.ggrc import api_helper
from integration.ggrc.models import factories
from integration.ggrc.services import TestCase


@ddt.ddt
class TestIssueResource(TestCase):
  """Tests for special issues api endpoints."""

  def setUp(self):
    super(TestIssueResource, self).setUp()
    self.client.get("/login")
    self.api = api_helper.Api()

  def test_snapshot_counts_query(self):
    """Test snapshot_counts endpoint"""

    with factories.single_commit():
      audit = factories.AuditFactory()
      issue_1 = factories.IssueFactory(audit=audit)
      control = factories.ControlFactory()
      regulation = factories.RegulationFactory()
      factories.RelationshipFactory(
          source=issue_1,
          destination=control
      )
      issue_2 = factories.IssueFactory(audit=audit)

    with factories.single_commit():
      revision = all_models.Revision.query.filter(
          all_models.Revision.resource_type == "Issue",
          all_models.Revision.resource_id == issue_1.id
      ).first()
      revision_2 = all_models.Revision.query.filter(
          all_models.Revision.resource_type == "Issue",
          all_models.Revision.resource_id == issue_2.id
      ).first()
      snapshot_1 = factories.SnapshotFactory(
          parent=issue_1.audit,
          child_type=control.type,
          child_id=control.id,
          revision=revision
      )
      factories.RelationshipFactory(
          source=issue_1,
          destination=snapshot_1,
      )
      snapshot_2 = factories.SnapshotFactory(
          parent=issue_2.audit,
          child_type=regulation.type,
          child_id=regulation.id,
          revision=revision_2
      )
      factories.RelationshipFactory(
          source=issue_2,
          destination=snapshot_2,
      )

    issues = [issue_1, issue_2]
    expected_snapshot_counts = {
        issue_1.id: {"Control": 1},
        issue_2.id: {"Regulation": 1},
    }

    for issue in issues:
      response = self.api.client.get(
          "/api/issues/{}/snapshot_counts".format(issue.id),
      )
      snapshot_counts = json.loads(response.data)
      self.assertEqual(snapshot_counts,
                       expected_snapshot_counts[issue.id])
