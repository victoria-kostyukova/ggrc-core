# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Base Class for Saved Search tests"""

import json
from flask_testing import TestCase

from ggrc.app import app


class SavedSearchBaseTest(TestCase):
  """Base class for Saved Search tests"""

  SAVED_SEARCH_URI = "/api/saved_searches"

  API_URL = SAVED_SEARCH_URI + "/{search_type}?object_type={object_type}"

  SAVED_SEARCH_TYPE = "GlobalSearch"

  def _post_saved_search(self, payload):
    """Send POST request for creating new SavedSearch"""
    response = self._client.post(
        self.SAVED_SEARCH_URI,
        data=json.dumps(payload),
        headers=self._headers,
    )

    return json.loads(response.data)

  def _delete_saved_search(self, saved_search_id):
    """Send DELETE request for SavedSearch"""
    return self._client.delete(
        self.SAVED_SEARCH_URI + "/{}".format(saved_search_id),
        headers=self._headers,
    )

  def _get_saved_search(self, object_type):
    """Get SavedSearches base on {object_type}"""
    response = self._client.get(
        self.API_URL.format(object_type=object_type,
                            search_type=self.SAVED_SEARCH_TYPE),
        headers=self._headers
    )
    return json.loads(response.data)

  @staticmethod
  def create_app():
    """Override flask method"""
    return app

  def setUp(self):
    """Login before each test"""
    self._client.get("/login", headers=self._headers)

  def tearDown(self):
    """Logout after each test"""
    self._client.get("/logout", headers=self._headers)
