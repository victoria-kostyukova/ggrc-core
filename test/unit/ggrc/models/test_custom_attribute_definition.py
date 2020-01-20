# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test Custom Attribute Definition validation"""

import unittest
import ddt
from mock import MagicMock

from ggrc.models import all_models
from ggrc.access_control import role as acr


@ddt.ddt
class TestCustomAttributeDefinition(unittest.TestCase):
  """Test Custom Attribute Definition validation"""

  def setUp(self):
    # pylint: disable=protected-access
    self.cad = all_models.CustomAttributeDefinition()
    self.cad._get_reserved_names = MagicMock(return_value=frozenset({'title'}))
    self.cad._get_global_cad_names = MagicMock(return_value={'reg url': 1})
    acr.get_custom_roles_for = MagicMock(return_value=dict())

  @ddt.data("title with asterisk*",
            "map:person",
            "unmap:person",
            "delete",
            "  map:    Market",
            "mAP:    CONTROL",
            "UNMAP:  NOTHING",
            "DeLeTe",
            )
  def test_title_with_asterisk_throws(self, title):
    """Test if raises if title invalid"""
    with self.assertRaises(ValueError):
      self.cad.validate_title("title", title)
