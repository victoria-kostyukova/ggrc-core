# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Module for pagination tests"""

import unittest

import ddt

from ggrc.query import pagination


@ddt.ddt
class TestPaginationHelper(unittest.TestCase):
  """Tests for pagination module"""

  @ddt.data(True, False)
  def test_add_additional_sorting(self, desc):
    """Test additional sorting"""
    order_by = pagination.get_sorting_by_id([{"name": "title",
                                              "desc": desc},
                                             {"name": "date"}])
    self.assertEqual([{"name": "id", "desc": desc}], order_by)

  def test_do_not_add_sorting(self):
    """We do not additional sorting if sort by id"""
    init_sorting = [{"name": "id", "desc": True}]
    order_by = pagination.get_sorting_by_id(init_sorting)
    self.assertEqual([], order_by)
