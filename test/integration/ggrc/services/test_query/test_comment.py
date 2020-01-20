# coding: utf-8

# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests for Comment /query api endpoint."""

import datetime

from integration.ggrc import TestCase
from integration.ggrc.api_helper import Api
from integration.ggrc.models import factories
from integration.ggrc_workflows.models import factories as wf_factories


class TestCommentQueries(TestCase):
  """Tests for /query api for Comment instance ordering."""

  def setUp(self):
    super(TestCommentQueries, self).setUp()
    self.api = Api()

  def test_comment_ordering(self):
    """Check ordering for comment"""
    with factories.single_commit():
      cgot = wf_factories.CycleTaskGroupObjectTaskFactory()
      comment1 = factories.CommentFactory(
          description="comment 1",
          created_at=datetime.datetime(2017, 1, 1, 7, 31, 32)
      )
      comment2 = factories.CommentFactory(
          description="comment 2",
          created_at=datetime.datetime(2017, 1, 1, 7, 31, 42)
      )
      factories.RelationshipFactory(source=comment1, destination=cgot)
      factories.RelationshipFactory(source=comment2, destination=cgot)

    query_request_data = [
        {
            u"object_name": u"Comment",
            u"filters": {
                u"expression": {
                    u"object_name": u"CycleTaskGroupObjectTask",
                    u"op": {
                        u"name": u"relevant"
                    },
                    u"ids": [cgot.id]
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
    self.assertEqual(2, resp.json[0]["Comment"]["count"])
    self.assertEqual(
        "comment 2", resp.json[0]["Comment"]["values"][0]["description"]
    )
    self.assertEqual(
        "comment 1", resp.json[0]["Comment"]["values"][1]["description"]
    )
