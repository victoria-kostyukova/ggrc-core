# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Module for integration tests for Relationship."""

import ddt

from ggrc.models import all_models
from integration.external_app.external_api_helper import ExternalApiClient

from integration.ggrc import TestCase
from integration.ggrc.models import factories


@ddt.ddt
class TestExternalRelationshipNew(TestCase):
  """Integration test suite for External Relationship."""

  # pylint: disable=invalid-name

  def setUp(self):
    """Init API helper"""
    super(TestExternalRelationshipNew, self).setUp()
    self.ext_api = ExternalApiClient()

  def test_ext_app_delete_normal_relationship(self):
    """External app can't delete normal relationships"""

    with factories.single_commit():
      issue = factories.IssueFactory()
      objective = factories.ObjectiveFactory()

      relationship = factories.RelationshipFactory(
          source=issue, destination=objective, is_external=False
      )
      relationship_id = relationship.id
    ext_api = ExternalApiClient(use_ggrcq_service_account=True)
    resp = ext_api.delete("relationship", relationship_id)
    self.assertStatus(resp, 400)

  def test_ext_app_recreate_normal_relationship(self):
    """If ext app create already created relationship
    it has to be with is_external=False"""
    with factories.single_commit():
      obj_1 = factories.StandardFactory()
      obj_2 = factories.RegulationFactory()
      relationship = factories.RelationshipFactory(
          source=obj_1,
          destination=obj_2,
          is_external=False,
      )
      relationship_id = relationship.id
    ext_api = ExternalApiClient(use_ggrcq_service_account=False)

    response = ext_api.post(all_models.Relationship, data={
        "relationship": {
            "source": {"id": obj_1.id, "type": obj_1.type},
            "destination": {"id": obj_2.id, "type": obj_2.type},
            "is_external": True,
            "context": None,
        },
    })

    self.assert200(response)
    relationship = all_models.Relationship.query.get(relationship_id)
    self.assertFalse(relationship.is_external)

  def test_sync_service_delete_normal_relationship(self):
    """Sync service can delete normal relationships via unmap endpoint"""

    with factories.single_commit():
      issue = factories.IssueFactory()
      objective = factories.ObjectiveFactory()

      relationship = factories.RelationshipFactory(
          source=issue, destination=objective, is_external=False
      )
      relationship_id = relationship.id
    resp = self.ext_api.unmap(issue, objective)
    self.assert200(resp)
    rel = all_models.Relationship.query.get(relationship_id)
    self.assertIsNone(rel)

  def test_sync_service_delete_related_relationships(self):
    """Test sync service delete both relationship on request"""
    with factories.single_commit():
      issue = factories.IssueFactory()
      objective = factories.ObjectiveFactory()
      relationship1 = factories.RelationshipFactory(
          source=issue, destination=objective, is_external=False
      )
      relationship1_id = relationship1.id
      relationship2 = factories.RelationshipFactory(
          source=objective, destination=issue, is_external=False
      )
      relationship2_id = relationship2.id

    resp = self.ext_api.unmap(issue, objective)

    self.assert200(resp)
    rel1 = all_models.Relationship.query.get(relationship1_id)
    rel2 = all_models.Relationship.query.get(relationship2_id)
    self.assertIsNone(rel1)
    self.assertIsNone(rel2)

  @ddt.data(True, False)
  def test_external_recreate_relationship(self, use_ggrcq_service_account):
    """Test sync service or external app can't create related relationship"""
    with factories.single_commit():
      issue = factories.IssueFactory()
      issue_id = issue.id
      objective = factories.ObjectiveFactory()
      objective_id = objective.id
    ext_api = ExternalApiClient(
        use_ggrcq_service_account=use_ggrcq_service_account
    )

    resp1 = ext_api.post(all_models.Relationship, data={
        "relationship": {
            "source": {"id": issue_id, "type": "Issue"},
            "destination": {"id": objective_id, "type": "Objective"},
            "is_external": True,
            "context": None
        },
    })
    self.assert201(resp1)
    resp2 = ext_api.post(all_models.Relationship, data={
        "relationship": {
            "source": {"id": objective_id, "type": "Objective"},
            "destination": {"id": issue_id, "type": "Issue"},
            "is_external": True,
            "context": None
        },
    })
    self.assert201(resp2)

    relationships_count = all_models.Relationship.query.count()
    self.assertEqual(relationships_count, 1)

  def test_ext_app_delete_related_relationship(self):
    """External app should delete all related relationships"""
    with factories.single_commit():
      issue = factories.IssueFactory()
      objective = factories.ObjectiveFactory()
      relationship1 = factories.RelationshipFactory(
          source=issue, destination=objective, is_external=True
      )
      relationship2 = factories.RelationshipFactory(
          source=objective, destination=issue, is_external=True
      )
      relationship1_id = relationship1.id
      relationship2_id = relationship2.id
    ext_api = ExternalApiClient(use_ggrcq_service_account=True)

    resp = ext_api.delete("relationship", relationship1_id)

    self.assertStatus(resp, 200)
    rel1 = all_models.Relationship.query.get(relationship1_id)
    rel2 = all_models.Relationship.query.get(relationship2_id)
    self.assertIsNone(rel1)
    self.assertIsNone(rel2)
