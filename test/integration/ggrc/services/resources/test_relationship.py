# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests for /api/relationship endpoints."""

import json

from ggrc.models import all_models
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
      source = factories.ProgramFactory()
      destination = factories.ObjectiveFactory()

    data = [{
        "relationship": {
            "context": None,
            "destination": {
                "id": source.id,
                "type": "Program",
                "href": "/api/programs/{}".format(source.id)
            },
            "source": {
                "id": destination.id,
                "type": "Objective",
                "href": "/api/objectives/{}".format(destination.id)
            }
        }
    }]
    response = self.api.client.post(
        "/api/relationships",
        data=json.dumps(data),
        headers=self.headers
    )
    self.assert200(response)
    rel_id = all_models.Relationship.query.one().id
    revs_count = all_models.Revision.query.filter_by(
        source_type="Objective", destination_type="Program"
    ).count()
    events_count = all_models.Event.query.filter_by(
        resource_id=rel_id, resource_type="Relationship",
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
        source_type="Objective", destination_type="Program"
    ).count()
    events_count = all_models.Event.query.filter_by(
        resource_id=rel_id, resource_type="Relationship",
    ).count()
    self.assertEqual(new_revs_count, 1)
    self.assertEqual(events_count, 1)
