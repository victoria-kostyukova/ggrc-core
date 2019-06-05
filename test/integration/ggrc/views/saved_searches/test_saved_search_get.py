# Copyright (C) 2019 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
# pylint: disable=missing-docstring,invalid-name

import json
from datetime import datetime
from random import random

from freezegun import freeze_time
from flask_testing import TestCase

from ggrc import db
from ggrc.app import app
from ggrc.models.saved_search import SavedSearch
from ggrc.models.person import Person

from integration.ggrc.views.saved_searches.initializers import (
    setup_user_role,
    get_client_and_headers,
)


class TestSavedSearchGet(TestCase):

  @staticmethod
  def create_app():
    return app

  @classmethod
  def setUpClass(cls):
    """
      Set up read-only test data to test GET requests.
    """

    super(TestSavedSearchGet, cls).setUpClass()

    with app.app_context():
      email_0 = "aniki_baniki_{}@test.com".format(random())
      cls._person_0 = Person(name="Aniki", email=email_0)

      email_1 = "baniki_aniki_{}@test.com".format(random())
      cls._person_1 = Person(name="Baniki", email=email_1)

      db.session.add(cls._person_0)
      db.session.add(cls._person_1)

      db.session.flush()

      cls._valid_query = [{
          "object_name": "Assessment",
          "filters": {"expression": {}},
          "limit": [0, 10],
          "order_by": [{"name": "updated_at", "desc": True}]
      }]

      locked_time = {
          "year": 2025,
          "month": 1,
          "day": 25,
          "minute": 0,
          "second": 0,
      }

      with freeze_time(datetime(**locked_time)) as frozen_time:
        for i in range(1, 5):
          user = cls._person_0 if i != 4 else cls._person_1

          saved_search = SavedSearch(
              name="test_ss_{}".format(i),
              query=cls._valid_query,
              object_type="Assessment",
              user=user,
          )
          user.saved_searches.append(saved_search)
          db.session.flush()
          #
          # we need to test the order in which saved
          # searches are returned in response to GET
          # request (descending order by created_at)
          # created_at precision is seconds
          #
          locked_time["second"] = i

          frozen_time.move_to(datetime(**locked_time))

      cls._user_role = setup_user_role(cls._person_0)
      db.session.commit()

      cls._client, cls._headers = get_client_and_headers(
          app, cls._person_0,
      )

  def setUp(self):
    self._client.get("/login", headers=self._headers)

  def tearDown(self):
    self._client.get("/logout", headers=self._headers)

  @classmethod
  def tearDownClass(cls):
    """
      Clean up created user and related saved searches.
    """

    super(TestSavedSearchGet, cls).tearDownClass()

    db.session.delete(cls._user_role)
    db.session.delete(cls._person_0)
    db.session.delete(cls._person_1)
    db.session.commit()

  def test_0_get_only_user_specific_saved_searches(self):
    response = self._client.get(
        "/api/saved_searches/Assessment",
        headers=self._headers,
    )

    data = json.loads(response.data)

    self.assertEqual(len(data["values"]), 3)

    for saved_search in data["values"]:
      self.assertEqual(saved_search["person_id"], self._person_0.id)

  def test_1_get_saved_searches_with_pagination(self):
    response = self._client.get(
        "/api/saved_searches/Assessment?offset=1&limit=2",
        headers=self._headers,
    )

    data = json.loads(response.data)

    self.assertEqual(len(data["values"]), 2)
    self.assertEqual(data["total"], 3)
    self.assertEqual(data["count"], 2)
    self.assertEqual(data["object_name"], "SavedSearch")
    self.assertEqual(data["values"][0]["name"], "test_ss_2")
    self.assertEqual(data["values"][1]["name"], "test_ss_1")
    self.assertEqual(data["values"][0]["object_type"], "Assessment")
    self.assertEqual(data["values"][0]["query"], json.dumps(self._valid_query))
    self.assertEqual(data["values"][0]["person_id"], self._person_0.id)
    self.assertIn("id", data["values"][0])
    self.assertIn("created_at", data["values"][0])
