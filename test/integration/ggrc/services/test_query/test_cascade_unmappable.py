# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test for cascade_unmappable operator."""

from integration import ggrc as test_ggrc
from integration.ggrc import factories
from integration.ggrc import api_helper


class TestCascadeUnmappable(test_ggrc.TestCase):
  """Test for correctness of `cascade_unmappable` operator."""

  @classmethod
  def setUpClass(cls):  # pylint: disable=missing-docstring
    super(TestCascadeUnmappable, cls).setUpClass()
    cls.api = api_helper.Api()

  def setUp(self):
    super(TestCascadeUnmappable, self).setUp()
    self.client.get("/login")

  def _perform_query(self, issue_id, assmt_id):
    """Request query to receive data"""
    query_request_data = [{
        u"object_name": u"Audit",
        u"filters":
            {
                u"expression": {
                    u"op": {u"name": u"cascade_unmappable"},
                    u"issue": {u"id": issue_id},
                    u"assessment": {u"id": assmt_id},
                }
            },
        u"limit": [0, 5]
    }]
    resp = self.api.send_request(
        self.api.client.post, data=query_request_data, api_link="/query"
    )
    return resp

  def test_audit_ok(self):
    """ Test an operator on an audit with a non-empty result

    Make sure that the operator returns an audit object if the audit has
    relations with an issue and an assessment, and doesn't have relations with
    other assessments.
    """
    with factories.single_commit():
      audit = factories.AuditFactory()
      issue = factories.IssueFactory()
      assessment = factories.AssessmentFactory()

      factories.RelationshipFactory(source=assessment, destination=audit)
      rel_assmt_issue = factories.RelationshipFactory(source=assessment,
                                                      destination=issue)
      factories.AutomappingFactory(parent=rel_assmt_issue)

    audit_id = audit.id
    issue_id = issue.id
    assmt_id = assessment.id

    resp = self._perform_query(issue_id, assmt_id)
    self.assert200(resp)
    self.assertEqual(len(resp.json), 1)
    self.assertEqual(resp.json[0]["Audit"]["count"], 1)
    self.assertEqual(audit_id, resp.json[0]["Audit"]["values"][0]["id"])

  def test_audit_bad(self):
    """ Test an operator on an audit with an empty result

    Make sure that the operator returns an empty result if the audit has
    relations with several different assessments.
    """
    with factories.single_commit():
      audit = factories.AuditFactory()
      issue = factories.IssueFactory()
      assessment = factories.AssessmentFactory()

      factories.RelationshipFactory(source=assessment, destination=audit)
      rel_assmt_issue = factories.RelationshipFactory(source=assessment,
                                                      destination=issue)
      factories.AutomappingFactory(parent=rel_assmt_issue)

      other_assessment = factories.AssessmentFactory()
      factories.RelationshipFactory(source=audit, destination=other_assessment)

    issue_id = issue.id
    assmt_id = assessment.id

    resp = self._perform_query(issue_id, assmt_id)
    self.assert200(resp)
    self.assertEqual(len(resp.json), 1)
    self.assertEqual(resp.json[0]["Audit"]["count"], 0)
