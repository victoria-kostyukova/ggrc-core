# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Module for validate decorator tests"""

import unittest

import ddt

from ggrc.query.custom_operators import validate
from ggrc.query.exceptions import BadQueryException


@ddt.ddt
class TestValidateDecorator(unittest.TestCase):
  """Tests for validate decorator"""

  @ddt.data(
      {
          'a': 'A',
          'd': 'D',
          'c': 15,
          'op': {'name': 'op'}
      },
      {
          'b': 'B',
          'd': 'D',
          'op': {'name': 'op'}
      },
      {
          't': 'T',
          'p': 'P',
          'op': {'name': 'op'}
      },
  )
  def test_required_fields(self, func_args):
    """test validate decorator validate correctly"""
    @validate('a', 'b')
    def test_func(*args):
      return args

    with self.assertRaises(BadQueryException):
      test_func(func_args)
