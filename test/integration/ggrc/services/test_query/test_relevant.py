# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests for relevant operator."""

import ddt

from ggrc.models import all_models

from integration.ggrc import TestCase
from integration.ggrc.query_helper import WithQueryApi
from integration.ggrc.models import factories


@ddt.ddt
class TestRelevant(TestCase, WithQueryApi):
  """Tests for relevant queries.

  The relevant query is an extension of the related operation in the way that
  it also includes special mappings not just the relationships table.
  """

  def setUp(self):
    super(TestRelevant, self).setUp()
    self.client.get("/login")

  @staticmethod
  def _make_relevant_filter(target_type, relevant_obj):
    return {
        "object_name": target_type,
        "type": "ids",
        "filters": {
            "expression": {
                "op": {"name": "relevant"},
                "object_name": relevant_obj.type,
                "ids": [relevant_obj.id],
            },
        },
    }

  @ddt.data(
      ("Assignees", lambda obj: obj, "assignee@example.com", 1),
      ("Auditors", lambda obj: obj.audit, "auditor@example.com", 0),
      (
          "Program Editors",
          lambda obj: obj.audit.program,
          "program_editor@example.com",
          0
      ),
  )
  @ddt.unpack
  def test_person_relevant(self, acr_name, acr_obj_resolver, email,
                           expected_count):
    """Check that only assessment roles can see relevant assessments"""
    with factories.single_commit():
      assessment = factories.AssessmentFactory()
      factories.RelationshipFactory(
          source=assessment.audit,
          destination=assessment,
      )
      person = factories.PersonFactory(email=email)
      factories.AccessControlPersonFactory(
          ac_list=acr_obj_resolver(assessment).acr_name_acl_map[acr_name],
          person=person,
      )

    ids = self._get_first_result_set(
        self._make_relevant_filter(
            target_type="Assessment",
            relevant_obj=person,
        ),
        "Assessment",
        "ids",
    )

    self.assertEqual(
        len(ids), expected_count,
        "Invalid relevant assessments count ({} instead of {}) for {}.".format(
            len(ids),
            expected_count,
            acr_name,
        )
    )

  def test_evidence_relevant(self):
    """Return ids of evidence in scope of given audit

    Exclude attached to audit itself
    """
    with factories.single_commit():
      audit = factories.AuditFactory()
      audit_id = audit.id
      assessment1 = factories.AssessmentFactory(audit=audit)
      assessment2 = factories.AssessmentFactory(audit=audit)
      factories.AssessmentFactory(audit=audit)
      evidence1 = factories.EvidenceUrlFactory()
      evidence1_id = evidence1.id
      evidence2 = factories.EvidenceUrlFactory()
      evidence2_id = evidence2.id
      evidence3 = factories.EvidenceUrlFactory()
      evidence3_id = evidence3.id
      factories.RelationshipFactory(source=assessment1,
                                    destination=evidence1)

      factories.RelationshipFactory(source=assessment2,
                                    destination=evidence2)
      factories.RelationshipFactory(source=audit,
                                    destination=evidence3)

    ids = self._get_first_result_set(
        {
            "object_name": "Evidence",
            "type": "ids",
            "filters": {
                "expression": {
                    "object_name": "Audit",
                    "op": {"name": "related_evidence"},
                    "ids": [audit_id],
                }
            }
        },
        "Evidence", "ids"
    )
    self.assertEqual(2, len(ids))
    self.assertIn(evidence1_id, ids)
    self.assertIn(evidence2_id, ids)
    self.assertNotIn(evidence3_id, ids)

  @ddt.data(
      (all_models.Control, all_models.Issue, True),
      (all_models.Control, all_models.Issue, False),
  )
  @ddt.unpack
  def test_issue_relevant_direct(self, target_cls, relevant_cls,
                                 mapped_directly):
    """Relevant op with Issue as `relevant` returns only direct mappings."""
    with factories.single_commit():
      target = factories.get_model_factory(target_cls.__name__)()
      relevant = factories.get_model_factory(relevant_cls.__name__)()
      if mapped_directly:
        factories.RelationshipFactory(
            source=target,
            destination=relevant,
        )
      else:
        revision = all_models.Revision.query.filter_by(
            resource_id=target.id,
            resource_type=target.type,
        ).first()
        snapshot = factories.SnapshotFactory(
            child_id=target.id,
            child_type=target.type,
            revision_id=revision.id,
        )
        factories.RelationshipFactory(
            source=snapshot,
            destination=relevant,
        )

    target_id = target.id
    result = self._get_first_result_set(
        self._make_relevant_filter(
            target_type=target.type,
            relevant_obj=relevant,
        ),
        target.type,
        "ids",
    )

    self.assertEqual(result,
                     [target_id] if mapped_directly else [])
