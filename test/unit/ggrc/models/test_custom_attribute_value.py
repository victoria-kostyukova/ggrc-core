# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test Custom Attribute Value validation."""

import unittest

import ddt
import mock

from ggrc.models import custom_attribute_value


@ddt.ddt
class TestCustomAttributeValue(unittest.TestCase):
  """Test Custom Attribute Value validation."""

  def setUp(self):
    self.cav = custom_attribute_value.CustomAttributeValueBase()

  def test_validate_dropdown(self):
    """Test for validate dropdown function."""
    # pylint: disable=protected-access
    self.cav.custom_attribute = mock.MagicMock()
    self.cav.custom_attribute.multi_choice_options = "1, 2, 3"
    self.cav.attribute_value = 1

    self.cav._validate_dropdown()
