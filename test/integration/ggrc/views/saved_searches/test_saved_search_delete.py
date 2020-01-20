# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
# pylint: disable=missing-docstring,invalid-name

import json
import unittest

from random import random

from ggrc import db
from ggrc.app import app
from ggrc.models.saved_search import SavedSearch
from ggrc.models.person import Person

from integration.ggrc.views.saved_searches.base import SavedSearchBaseTest
from integration.ggrc.views.saved_searches.initializers import (
    setup_user_role,
    get_client_and_headers,
)


class TestSavedSearchDelete(SavedSearchBaseTest):

  @classmethod
  def setUpClass(cls):
    """
      Set up read-only test data to test GET requests.
    """

    super(TestSavedSearchDelete, cls).setUpClass()

    with app.app_context():
      cls._person_0 = Person(
          name="Aniki",
          email="aniki_baniki_{}@test.com".format(random()),
      )
      db.session.add(cls._person_0)
      db.session.flush()

      saved_search = SavedSearch(
          name="test_ss_1",
          object_type="Assessment",
          user=cls._person_0,
          search_type="GlobalSearch"
      )
      cls._person_0.saved_searches.append(saved_search)
      db.session.flush()

      cls._user_role = setup_user_role(cls._person_0)
      db.session.commit()

      cls._client, cls._headers = get_client_and_headers(
          app, cls._person_0,
      )

      cls._saved_search_id = saved_search.id

  @classmethod
  def tearDownClass(cls):
    """
      Clean up created user and related saved searches.
    """

    super(TestSavedSearchDelete, cls).tearDownClass()

    db.session.delete(cls._user_role)
    db.session.delete(cls._person_0)
    db.session.commit()

  def test_0_successful_deletion_of_saved_search(self):
    response = self._delete_saved_search(self._saved_search_id)

    data = json.loads(response.data)

    self.assertEqual(response.status, "200 OK")
    self.assertEqual(data["deleted"], self._saved_search_id)

  #
  # This test sometimes fails locally due to logged in user
  # (flask_login.current_user) becoming AnonymousUserMixin for
  # unknown reason. It sometimes fails only when run in scope
  # of run_integration_ggrc script. Seems like something is
  # triggering logout event while delete request is processed
  # (requesting login before delete doesn't help). It passes
  # when run alone or in scope of all saved_search related
  # tests. It always failed on kokoro.
  #
  @unittest.skip("Investigate in scope of GGRC-7291")
  def test_1_deletion_failure(self):
    response = self._delete_saved_search(self._saved_search_id)

    data = json.loads(response.data)

    self.assertEqual(
        data["message"],
        "No saved search with id {} found for current user".format(
            self._saved_search_id,
        ),
    )
    self.assertEqual(data["code"], 404)
