# coding: utf-8

# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests for Program /query api endpoint."""

import ddt

from integration.ggrc import TestCase
from integration.ggrc.api_helper import Api
from integration.ggrc.models import factories


@ddt.ddt
class TestProgramQueries(TestCase):
  """Tests for /query api for Program child parent operators."""

  def setUp(self):
    super(TestProgramQueries, self).setUp()
    self.api = Api()

  @ddt.data("child", "parent")
  def test_mega_operators(self, operator):
    """Test {0} operator"""
    with factories.single_commit():
      program_a = factories.ProgramFactory()
      program_c = factories.ProgramFactory()
      program_b = factories.ProgramFactory()
      factories.RelationshipFactory(source=program_b,
                                    destination=program_a)
      factories.RelationshipFactory(source=program_c,
                                    destination=program_b)
    program_b_id = program_b.id
    if operator == "child":
      query_id = program_c.id
    elif operator == "parent":
      query_id = program_a.id
    query_request_data = [
        {
            u"object_name": u"Program",
            u"filters": {
                u"expression": {
                    u"object_name": u"Program",
                    u"op": {
                        u"name": operator
                    },
                    u"ids": [query_id]
                }
            },
            u"order_by": [{
                u"name": u"created_at",
                u"desc": True
            }]
        }
    ]
    resp = self.api.send_request(
        self.api.client.post, data=query_request_data, api_link="/query"
    )
    self.assertEqual(1, resp.json[0]["Program"]["count"])
    self.assertEqual(
        program_b_id, resp.json[0]["Program"]["values"][0]["id"]
    )

  @ddt.data("child", "parent")
  def test_mega_operators_bad_id(self, operator):
    """Test {0} operator with missing Program"""
    with factories.single_commit():
      program_a = factories.ProgramFactory()
      program_c = factories.ProgramFactory()
      program_b = factories.ProgramFactory()
      factories.RelationshipFactory(source=program_b,
                                    destination=program_a)
      factories.RelationshipFactory(source=program_c,
                                    destination=program_b)
    program_b_id = program_b.id
    if operator == "child":
      query_id = program_c.id
    elif operator == "parent":
      query_id = program_a.id
    query_request_data = [
        {
            u"object_name": u"Program",
            u"filters": {
                u"expression": {
                    u"object_name": u"Program",
                    u"op": {
                        u"name": operator
                    },
                    u"ids": [query_id, 12345]  # non-existent id of program
                }
            },
            u"order_by": [{
                u"name": u"created_at",
                u"desc": True
            }]
        }
    ]
    resp = self.api.send_request(
        self.api.client.post, data=query_request_data, api_link="/query"
    )
    self.assert200(resp)
    self.assertEqual(1, resp.json[0]["Program"]["count"])
    self.assertEqual(
        program_b_id, resp.json[0]["Program"]["values"][0]["id"]
    )
