# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test with_memcache util decorator"""

from unittest import TestCase
import mock
from ddt import data, ddt, unpack
from appengine import base
from ggrc.cache.memcache import cached


@ddt
@base.with_memcache
class TestMemcacheDecorator(TestCase):
  """Test decorator to emulate memcache in test"""

  TESTKEYS = ('1', '2', '3')

  # 2 test required for checking invalidation cache for each test case
  @data(TESTKEYS, TESTKEYS)
  @unpack
  def test_simple(self, *keys):
    """Simple test

    add value in cache
    check it's invalidation on each test"""
    for key in keys:
      self.assertIsNone(self.memcache_client.get(key))
      val = key * 10
      self.memcache_client.add(key, val)
      self.assertEqual(val, self.memcache_client.get(key))

  def test_expire(self):
    """Test decorator to emulate cache expire"""
    def test_func():
      pass
    cached_test_func = cached(test_func)
    cached_test_func.memcache_client.get = mock.Mock(side_effect=['1', None])
    self.assertEqual(cached_test_func(), '1')
    self.assertEqual(cached_test_func(), None)
