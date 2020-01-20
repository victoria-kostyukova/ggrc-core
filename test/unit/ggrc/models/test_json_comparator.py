# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test module for with_custom_restrictions mixin"""

import unittest
from datetime import datetime, date
import ddt

from ggrc.utils import json_comparator


@ddt.ddt
class TestJsonComparator(unittest.TestCase):
  """Test class for test_custom_restrictions"""

  @ddt.data(
      (datetime(2019, 10, 24), '2019-10-24T00:00:00'),
      (date(2019, 10, 24), '2019-10-24')
  )
  @ddt.unpack
  def test_convert_to_string(self, obj, exp_str):
    """Test convert_to_string method"""
    res_str = json_comparator.convert_to_string(obj)

    self.assertEqual(res_str, exp_str)

  @ddt.data(
      (
          [],
          [],
          True,
      ),
      (
          [1, 2, 3],
          [1, 2],
          False,
      ),
      (
          [{'1': 1, '5': 5}, {'1': 1, '2': 2}],
          [{'1': 1, '5': 5}, {'1': 1, '2': 2}],
          True,
      ),
      (
          [{'id': 123, 'type': 'assessment'}],
          [{'id': 123, 'type': 'assessment'}],
          True,
      ),
      (
          [{'id': 123, 'type': 'assessment', 'attr1': 1}],
          [{'id': 123, 'type': 'assessment', 'attr2': 2, 'attr3': 3}],
          True,
      ),
      (
          [{'id': 123, 'type': 'assessment'}],
          [{'id': 765, 'type': 'assessment'}],
          False,
      ),
      (
          [{'id': 123, 'type': 'assessment'}],
          [{'id': 123, 'type': 'issue'}],
          False,
      ),
  )
  @ddt.unpack
  def test_lists_equal(self, list1, list2, exp_result):
    """Test lists_equal method"""
    result = json_comparator.lists_equal(list1, list2)

    self.assertEqual(result, exp_result)

  @ddt.data(
      (
          {},
          {},
          True,
      ),
      (
          {'1': 1, '2': 2},
          {'1': 1, '2': 2},
          True,
      ),
      (
          {'1': 1, '2': 2},
          {'1': 1, '2': 2, '3': 3},
          True,
      ),
      (
          {'1': 1, '2': 2, '3': 3},
          {'1': 1, '2': 2},
          True,
      ),
      (
          {'1': 1, '2': 2, '3': 5},
          {'1': 1, '2': 2, '3': 3},
          False,
      ),
      (
          {'1': 1, '2': 2, '_3': 5},
          {'1': 1, '2': 2, '_3': 3},
          True,
      ),
  )
  @ddt.unpack
  def test_dicts_equal(self, dict1, dict2, exp_result):
    """Test dicts_equal method"""
    result = json_comparator.dicts_equal(dict1, dict2)

    self.assertEqual(result, exp_result)

  @ddt.data(
      (
          "",
          "",
          True,
      ),
      (
          {'1': 1, '2': 2},
          {'1': 1, '2': 2},
          True,
      ),
      (
          [1, 2, 3],
          [1, 2, 3],
          True,
      ),
      (
          [1, 2, 5],
          [1, 2, 3],
          False,
      ),
      (
          datetime(2019, 10, 24),
          datetime(2019, 10, 24),
          True,
      ),
      (
          datetime(2019, 10, 24),
          date(2019, 10, 24),
          False,
      ),
  )
  @ddt.unpack
  def test_fields_equal(self, obj_field, src_field, exp_result):
    """Test dicts_equal method"""
    result = json_comparator.fields_equal(obj_field, src_field)

    self.assertEqual(result, exp_result)
