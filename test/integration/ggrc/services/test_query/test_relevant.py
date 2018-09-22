# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests for relevant operator."""

import collections

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

  PEOPLE = [
      # Role name, email, expected count
      ("auditor", "auditor@example.com", 0),
      ("program_editor", "program_editor@example.com", 0),
      ("assignee", "assignee@example.com", 1),
  ]

  def setUp(self):
    super(TestRelevant, self).setUp()
    self.client.get("/login")

    with factories.single_commit():
      assessment = factories.AssessmentFactory()
      factories.RelationshipFactory(
          source=assessment.audit,
          destination=assessment,
      )
      people = {}
      for person in self.PEOPLE:
        people[person[0]] = factories.PersonFactory(email=person[1])
      # Correct roles and propagation for a given assessment
      factories.AccessControlPeopleFactory(
          ac_list=assessment.acr_name_acl_map["Assignees"],
          person=people["assignee"],
      )
      factories.AccessControlPeopleFactory(
          ac_list=assessment.audit.acr_name_acl_map["Auditors"],
          person=people["auditor"],
      )
      factories.AccessControlPeopleFactory(
          ac_list=assessment.audit.program.acr_name_acl_map["Program Editors"],
          person=people["program_editor"],
      )

  @ddt.data(*PEOPLE)
  @ddt.unpack
  def test_person_relevant(self, role, email, expected_count):
    """Check that only assessment roles can see relevant assessments"""
    person = all_models.Person.query.filter(
        all_models.Person.email == email
    ).one()

    ids = self._get_first_result_set(
        {
            "object_name": "Assessment",
            "type": "ids",
            "filters": {
                "expression": {
                    "object_name": "Person",
                    "op": {"name": "relevant"},
                    "ids": [person.id]
                }
            }
        },
        "Assessment", "ids"
    )
    self.assertEqual(
        len(ids), expected_count,
        "Invalid relevant assessments count ({} instead of {}) for {}.".format(
            len(ids),
            expected_count,
            role,
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
