# Copyright (C) 2019 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests for /api/relationship endpoints."""

import json

from ggrc.models import all_models
from integration.external_app import external_api_helper
from integration.ggrc import api_helper
from integration.ggrc.models import factories
from integration.ggrc.services import TestCase


class TestRelationshipResource(TestCase):
  """Tests for special api endpoints."""

  def setUp(self):
    super(TestRelationshipResource, self).setUp()
    self.api = api_helper.Api()

  def test_map_object(self):
    """It should be possible to map an object to an audit."""
    with factories.single_commit():
      program = factories.ProgramFactory()
      audit = factories.AuditFactory(program=program)
      factories.RelationshipFactory(
          source=audit,
          destination=program
      )
      product = factories.ProductFactory()
      factories.RelationshipFactory(
          source=program,
          destination=product
      )

    data = [{
        "relationship": {
            "context": None,
            "destination": {
                "id": product.id,
                "type": "Product",
                "href": "/api/products/{}".format(product.id)
            },
            "source": {
                "id": audit.id,
                "type": "Audit",
                "href": "/api/audits/{}".format(audit.id)
            }
        }
    }]

    response = self.api.client.post(
        "/api/relationships",
        data=json.dumps(data),
        headers=self.headers
    )
    self.assert200(response)

  def test_one_revision_created(self):
    """Test no create revision and events from duplicated relationship"""
    with factories.single_commit():
      destination = factories.ProgramFactory()
      source = factories.ObjectiveFactory()

    data = [{
        "relationship": {
            "context": None,
            "destination": {
                "id": destination.id,
                "type": destination.type
            },
            "source": {
                "id": source.id,
                "type": source.type
            },
        }
    }]
    response = self.api.client.post(
        "/api/relationships",
        data=json.dumps(data),
        headers=self.headers
    )
    self.assert200(response)
    self._test_update_duplicated_relationship(data)

  def test_one_revision_for_external_relationship(self):
    """Test one revision and event created when relationship is external"""
    # pylint: disable=invalid-name

    ext_api = external_api_helper.ExternalApiClient()

    with factories.single_commit():
      destination = factories.ProgramFactory()
      source = factories.ObjectiveFactory()
    data = {
        "relationship": {
            "source": {
                "id": source.id,
                "type": source.type
            },
            "destination": {
                "id": destination.id,
                "type": destination.type
            },
            "is_external": True,
            "context": None,
        },
    }
    response = ext_api.post(
        all_models.Relationship,
        data=data
    )
    self.assert201(response)
    data["relationship"].pop("is_external")
    self._test_update_duplicated_relationship([data])

  def _test_update_duplicated_relationship(self, data):
    """Test update duplicated relationship"""
    # pylint: disable=invalid-name

    rel_id = all_models.Relationship.query.one().id
    revs_count = all_models.Revision.query.filter_by(
        source_type="Objective",
        destination_type="Program",
    ).count()
    events_count = all_models.Event.query.filter_by(
        resource_id=rel_id,
        resource_type="Relationship",
    ).count()
    self.assertEqual(revs_count, 1)
    self.assertEqual(events_count, 1)

    response = self.api.client.post(
        "/api/relationships",
        data=json.dumps(data),
        headers=self.headers
    )
    self.assert200(response)
    new_revs_count = all_models.Revision.query.filter_by(
        source_type="Objective",
        destination_type="Program",
    ).count()
    events_count = all_models.Event.query.filter_by(
        resource_id=rel_id,
        resource_type="Relationship",
    ).count()
    self.assertEqual(new_revs_count, 1)
    self.assertEqual(events_count, 1)
