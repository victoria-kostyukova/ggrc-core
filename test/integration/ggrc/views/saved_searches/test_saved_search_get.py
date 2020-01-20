# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
# pylint: disable=missing-docstring,invalid-name

import json
from datetime import datetime
from random import random

from freezegun import freeze_time

from ggrc import db
from ggrc.app import app
from ggrc.models.saved_search import SavedSearch
from ggrc.models.person import Person

from integration.ggrc.models import factories
from integration.ggrc.views.saved_searches.base import SavedSearchBaseTest
from integration.ggrc.views.saved_searches.initializers import (
    setup_user_role,
    get_client_and_headers,
)


class TestSavedSearchGet(SavedSearchBaseTest):

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
              object_type="Assessment",
              user=user,
              search_type=cls.SAVED_SEARCH_TYPE
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

        saved_search_program = SavedSearch(
            name="test_program_ss",
            object_type="Program",
            user=cls._person_0,
            search_type=cls.SAVED_SEARCH_TYPE
        )
        cls._person_0.saved_searches.append(saved_search_program)
        db.session.flush()

      cls._user_role = setup_user_role(cls._person_0)
      db.session.commit()

      cls._client, cls._headers = get_client_and_headers(
          app, cls._person_0,
      )

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
        self.API_URL.format(object_type="Assessment",
                            search_type=self.SAVED_SEARCH_TYPE),
        headers=self._headers,
    )

    data = json.loads(response.data)

    self.assertEqual(len(data["values"]), 3)

    for saved_search in data["values"]:
      self.assertEqual(saved_search["person_id"], self._person_0.id)

  def test_1_get_saved_searches_with_pagination(self):
    response = self._client.get(
        self.SAVED_SEARCH_URI +
        "/{search_type}?offset=1&limit=2&object_type=Assessment".format(
            search_type=self.SAVED_SEARCH_TYPE
        ),
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
    self.assertEqual(data["values"][0]["person_id"], self._person_0.id)
    self.assertIn("id", data["values"][0])
    self.assertIn("created_at", data["values"][0])

  def test_2_get_saved_searches_total_only_type(self):
    """Test that total returns only count of specific object type objects"""
    data_program = self._get_saved_search(object_type="Program")
    data_assessment = self._get_saved_search(object_type="Assessment")

    self.assertEqual(data_program["total"], 1)
    self.assertEqual(data_assessment["total"], 3)

  def test_3_get_saved_search_by_id(self):
    data_assessment = self._get_saved_search(object_type="Assessment")
    assmt = data_assessment["values"][0]
    response = self._client.get("{uri}/{id}".format(uri=self.SAVED_SEARCH_URI,
                                                    id=assmt["id"]),
                                headers=self._headers)
    saved_search = json.loads(response.data)["SavedSearch"]
    self.assertEqual(assmt["name"], saved_search["name"])
    self.assertEqual(assmt["id"], saved_search["id"])
    self.assertEqual(assmt["object_type"], saved_search["object_type"])

  def test_get_saved_searches_only_visible(self):
    """Test that GET saved searches by type returns only visible ones."""
    with factories.single_commit():
      invisible_ss = factories.SavedSearchFactory(
          object_type="Assessment",
          user=self._person_0,
          is_visible=False,
      )

    invisible_ss_id = invisible_ss.id
    data_assessment = self._get_saved_search(object_type="Assessment")

    self.assertEqual(data_assessment["total"], 3)
    self.assertNotIn(
        invisible_ss_id,
        [item["id"] for item in data_assessment["values"]],
    )
