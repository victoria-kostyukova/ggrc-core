# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Unit tests for utils revisions_diff."""

import unittest

import ddt
import mock

from ggrc.models import custom_attribute_definition as cad
from ggrc.utils.revisions_diff import builder


@ddt.ddt
class TestRevisionsDiffBuilder(unittest.TestCase):
  """Unittests for revisions_diff builder."""

  @ddt.data(
      (1, u"1"),
      (0, u"0"),
      (None, None)
  )
  @ddt.unpack
  def test_get_validated_value_checkbox(self, value, expected):
    """test for validate CAD checkbox type."""
    name = cad.CustomAttributeDefinitionBase.ValidTypes.CHECKBOX
    object_id = 1
    attribute = mock.MagicMock(attribute_type=name)
    attribute.ValidTypes.CHECKBOX = name

    result, object_id = builder.get_validated_value(
        attribute, value, object_id)

    self.assertEqual(result, expected)
