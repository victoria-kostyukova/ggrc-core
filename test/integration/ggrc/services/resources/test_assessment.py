# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests for /api/assessments endpoints."""
import json

import ddt

from ggrc.models import all_models
from integration.ggrc import api_helper
from integration.ggrc.models import factories
from integration.ggrc.services import TestCase


@ddt.ddt
class TestAssessmentResource(TestCase):
  """Tests for special people api endpoints."""

  def setUp(self):
    super(TestAssessmentResource, self).setUp()
    self.client.get("/login")
    self.api = api_helper.Api()

  def _get_related_objects(self, assessment):
    """Helper for retrieving assessment related objects."""
    url = "/api/assessments/{}/related_objects".format(assessment.id)
    return self.client.get(url).json

  def test_object_fields(self):
    """Test that objects contain mandatory fields.

    Front-end relies on audits containing id, type, title, and
    description. This tests ensures that those fields are returned in the
    related_objects response.
    """
    with factories.single_commit():
      assessment = factories.AssessmentFactory()
      factories.IssueFactory()  # unrelated issue
      for _ in range(2):
        issue = factories.IssueFactory()
        factories.RelationshipFactory.randomize(assessment, issue)
    related_objects = self._get_related_objects(assessment)

    expected_keys = {"id", "type", "title", "description"}
    self.assertLessEqual(
        expected_keys,
        set(related_objects["Audit"].keys())
    )

  def test_fields_in_response(self):
    """Test that objects contain only expected field."""
    with factories.single_commit():
      assessment = factories.AssessmentFactory()
      factories.IssueFactory()  # unrelated issue
      for _ in range(2):
        issue = factories.IssueFactory()
        factories.RelationshipFactory.randomize(assessment, issue)

    expected_fields = {"Audit", "Comment", "Snapshot",
                       "Evidence:URL", "Evidence:FILE"}
    related_objects = self._get_related_objects(assessment)

    self.assertEqual(expected_fields, set(related_objects.keys()))

  def test_snapshot_counts_query(self):
    """Test snapshot_counts endpoint"""

    with factories.single_commit():
      assessment_1 = factories.AssessmentFactory()
      control = factories.ControlFactory()
      regulation = factories.RegulationFactory()
      factories.RelationshipFactory(
          source=assessment_1,
          destination=control
      )
      assessment_2 = factories.AssessmentFactory()

    with factories.single_commit():
      revision = all_models.Revision.query.filter(
          all_models.Revision.resource_type == "Assessment",
          all_models.Revision.resource_id == assessment_1.id
      ).first()
      revision_2 = all_models.Revision.query.filter(
          all_models.Revision.resource_type == "Assessment",
          all_models.Revision.resource_id == assessment_2.id
      ).first()
      snapshot_1 = factories.SnapshotFactory(
          parent=assessment_1.audit,
          child_type=control.type,
          child_id=control.id,
          revision=revision
      )
      factories.RelationshipFactory(
          source=assessment_1,
          destination=snapshot_1,
      )
      snapshot_2 = factories.SnapshotFactory(
          parent=assessment_2.audit,
          child_type=regulation.type,
          child_id=regulation.id,
          revision=revision_2
      )
      factories.RelationshipFactory(
          source=assessment_2,
          destination=snapshot_2,
      )

    assessments = [assessment_1, assessment_2]
    expected_snapshot_counts = {
        assessment_1.id: {"Control": 1, "Regulation": 0},
        assessment_2.id: {"Control": 0, "Regulation": 1},
    }

    for assessment in assessments:
      response = self.api.client.post(
          "/api/assessments/{}/snapshot_counts".format(assessment.id),
          data=json.dumps({"snapshot_types": ("Control", "Regulation")}),
          headers=self.headers
      )
      snapshot_counts = json.loads(response.data)
      self.assertEqual(snapshot_counts,
                       expected_snapshot_counts[assessment.id])
