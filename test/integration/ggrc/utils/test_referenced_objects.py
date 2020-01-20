# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Tests referenced_objects functionality."""

from mock import patch
from integration.ggrc import TestCase


class TestReferencedObjects(TestCase):
  """Tests referenced_objects functionality."""

  def setUp(self):
    """Set up for test cases."""
    super(TestReferencedObjects, self).setUp()
    self.id_ = 1  # id of the object in the db

  @patch('flask.g')
  def test_no_result_in_cache_acp(self, flask_g):
    """Test case when no result in cache."""
    from ggrc.access_control.people import AccessControlPerson
    from ggrc.utils.referenced_objects import get
    with patch.object(flask_g, 'referenced_objects', {}):
      get(AccessControlPerson, self.id_)
