# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests for /query api endpoint."""

import ddt

from ggrc.models import all_models

from integration.ggrc import TestCase
from integration.ggrc.api_helper import Api
from integration.ggrc.models import factories
from integration.ggrc.query_helper import WithQueryApi


@ddt.ddt
class TestArchived(WithQueryApi, TestCase):
  """Tests for filtering by Archived field."""
  # pylint: disable=invalid-name
  def setUp(self):
    super(TestArchived, self).setUp()
    self.client.get("/login")
    self.api = Api()

  @ddt.data([1, 3])
  def test_archived_audits(self, archived_audits):
    """Test filtration by Archived Audits."""
    with factories.single_commit():
      audit_ids = [factories.AuditFactory().id for _ in range(5)]

    expected_ids = []
    for i in archived_audits:
      audit = all_models.Audit.query.get(audit_ids[i])
      response = self.api.put(audit, {"archived": True})
      self.assert200(response)
      expected_ids.append(audit_ids[i])

    ids = self.simple_query(
        "Audit",
        expression=["archived", "=", "true"],
        type_="ids",
        field="ids"
    )
    self.assertItemsEqual(ids, expected_ids)

  @ddt.data([2, 4])
  def test_archived_assessments(self, archived_audits):
    """Test filtration by Archived Assessments."""
    # Create 5 Audits, each of them has 3 Assessment
    with factories.single_commit():
      audit_ids = []
      for _ in range(5):
        audit = factories.AuditFactory()
        audit_ids.append(audit.id)
        for _ in range(3):
          factories.AssessmentFactory(audit=audit)

    # This list contain ids of assessments from audits in archived_audits
    expected_ids = []
    for i in archived_audits:
      audit = all_models.Audit.query.get(audit_ids[i])
      expected_ids += [a.id for a in audit.assessments]
      response = self.api.put(audit, {"archived": True})
      self.assert200(response)

    ids = self.simple_query(
        "Assessment",
        expression=["archived", "=", "true"],
        type_="ids",
        field="ids"
    )
    self.assertItemsEqual(ids, expected_ids)

  def _archive_audit_and_check_evidence(self, audit, evidence_ids):
    """Helper function archive audit and check evidences is archived"""
    response = self.api.put(audit, {"archived": True})
    self.assert200(response)
    ids = self.simple_query(
        "Evidence",
        expression=["archived", "=", "true"],
        type_="ids",
        field="ids"
    )
    self.assertItemsEqual(ids, evidence_ids)

  def test_archived_evidence_forward(self):
    """Test evidence archived with audit in audit -> assessment"""
    expected_evidence_ids = []
    with factories.single_commit():
      audit = factories.AuditFactory()
      assessment = factories.AssessmentFactory(audit=audit)
      evidence = factories.EvidenceUrlFactory()
      factories.RelationshipFactory(source=audit,
                                    destination=assessment)
      factories.RelationshipFactory(source=evidence,
                                    destination=assessment)
      expected_evidence_ids.append(evidence.id)
    self._archive_audit_and_check_evidence(audit, expected_evidence_ids)

  def test_archived_evidence_backward(self):
    """Test evidence archived with audit in assessment -> audit"""
    expected_evidence_ids = []
    with factories.single_commit():
      audit = factories.AuditFactory()
      assessment = factories.AssessmentFactory(audit=audit)
      evidence = factories.EvidenceUrlFactory()
      factories.RelationshipFactory(source=assessment,
                                    destination=audit)
      factories.RelationshipFactory(source=assessment,
                                    destination=evidence)
      expected_evidence_ids.append(evidence.id)
    self._archive_audit_and_check_evidence(audit, expected_evidence_ids)

  def test_archived_evidence_from_audit_forward(self):
    """Test evidence archived with audit in audit -> evidence"""
    expected_evidence_ids = []
    with factories.single_commit():
      audit = factories.AuditFactory()
      evidence = factories.EvidenceUrlFactory()
      factories.RelationshipFactory(source=audit,
                                    destination=evidence)
      expected_evidence_ids.append(evidence.id)
    self._archive_audit_and_check_evidence(audit, expected_evidence_ids)

  def test_archived_evidence_from_audit_backward(self):
    """Test evidence archived with audit in evidence -> audit"""
    expected_evidence_ids = []
    with factories.single_commit():
      audit = factories.AuditFactory()
      evidence = factories.EvidenceUrlFactory()
      factories.RelationshipFactory(source=evidence,
                                    destination=audit)
      expected_evidence_ids.append(evidence.id)
    self._archive_audit_and_check_evidence(audit, expected_evidence_ids)
