# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Unit test suite for functions from ggrc.migrations.utils.strip_text_field"""

import unittest
import ddt

from ggrc.migrations.utils.strip_text_field import get_unique_value, \
    get_queries_for_stripping


@ddt.ddt
class TestStripUtils(unittest.TestCase):
  """Test strip_text_field"""

  @ddt.data(
      ('value', set(), 'value'),
      ('value', {'value'}, 'value-1'),
      ('value', {'value-1'}, 'value'),
  )
  @ddt.unpack
  def test_get_unique_value(self, value, existing_values, expected):
    """Test get_unique_value"""
    result = get_unique_value(value, existing_values)
    self.assertEqual(result, expected)

  def test_get_queries_for_stripping(self):
    """Test test_get_queries_for_stripping"""
    table_name = 'test_table'
    field = 'some_field'
    records = {
        0: ' value',
        1: 'value ',
        2: 'value',
        9: ' value ',
        5: 'value-123',
        3: None,
    }
    unique = True

    expected_result = [
        {'id': 9,
         'text': 'UPDATE test_table SET some_field = :val WHERE id = :id',
         'val': 'value-3'},
        {'id': 1,
         'text': 'UPDATE test_table SET some_field = :val WHERE id = :id',
         'val': 'value-2'},
        {'id': 0,
         'text': 'UPDATE test_table SET some_field = :val WHERE id = :id',
         'val': 'value-1'},
    ]

    result = get_queries_for_stripping(table_name, field, records, unique)
    self.assertEqual(result, expected_result)
