# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test blob methods for working with memcache."""

from unittest import TestCase
import mock

from appengine import base

from ggrc.utils import memcache


@base.with_memcache
class TestBlobMemcacheOperations(TestCase):
  """Test memcache blob operations."""

  def test_big_value_saving(self):
    """Test storing in memcache huge chunk of data."""
    # Create a structure with a lot of data. It should take more than 1 Mb.
    data = {"a": {"b": ["test" * 10 for _ in range(10 ** 6)]}}
    self.assertTrue(memcache.blob_set(self.memcache_client, "data", data))
    self.assertGreater(
        self.memcache_client.get_stats().get("bytes"),
        memcache.MEMCACHE_MAX_ITEM_SIZE
    )
    self.assertEqual(
        data,
        memcache.blob_get(self.memcache_client, "data")
    )

  @mock.patch('ggrc.utils.memcache.MEMCACHE_MAX_ITEM_SIZE', 5)
  @mock.patch('ggrc.utils.memcache._encode_data', lambda a: a)
  @mock.patch('ggrc.utils.memcache._decode_data', lambda a: a)
  def test_blob_set(self):
    """Test blob_set()"""
    # set cache which will be split to 3 chunks (5+5+1 bytes)
    memcache.blob_set(self.memcache_client, "a", "01234567890")
    keys = memcache.blob_get_chunk_keys(self.memcache_client, "a")
    self.assertEqual(keys, ["a:0", "a:5", "a:10"])

  @mock.patch('ggrc.utils.memcache.MEMCACHE_MAX_ITEM_SIZE', 5)
  @mock.patch('ggrc.utils.memcache._encode_data', lambda a: a)
  @mock.patch('ggrc.utils.memcache._decode_data', lambda a: a)
  def test_blob_set_chunks(self):
    """Test blob_set() chunks"""
    # set cache which will be split to 3 chunks (5+5+1 bytes)
    memcache.blob_set(self.memcache_client, "a", "01234567890")
    self.assertEqual(self.memcache_client.get("a:0"), "01234")
    self.assertEqual(self.memcache_client.get("a:5"), "56789")
    self.assertEqual(self.memcache_client.get("a:10"), "0")

  @mock.patch('ggrc.utils.memcache.MEMCACHE_MAX_ITEM_SIZE', 5)
  @mock.patch('ggrc.utils.memcache._encode_data', lambda a: a)
  @mock.patch('ggrc.utils.memcache._decode_data', lambda a: a)
  def test_blob_set_get(self):
    """Test blob set/get operation"""
    # set cache which will be split to 3 chunks (5+5+1 bytes)
    data = "01234567890"

    memcache.blob_set(self.memcache_client, "a", data)
    result = memcache.blob_get(self.memcache_client, "a")

    self.assertEqual(result, data)

  @mock.patch('ggrc.utils.memcache.MEMCACHE_MAX_ITEM_SIZE', 5)
  @mock.patch('ggrc.utils.memcache._encode_data', lambda a: a)
  @mock.patch('ggrc.utils.memcache._decode_data', lambda a: a)
  def test_delete_on_blob_set(self):
    """Test blob set remove old chunks"""
    # set cache which will be split to 3 chunks (5+5+1 bytes)
    memcache.blob_set(self.memcache_client, "a", "01234567890")
    # set cache with 2 chunks (5+2 bytes)
    memcache.blob_set(self.memcache_client, "a", "abcdefg")

    # ensure that chunk #3 was removed
    self.assertIsNone(self.memcache_client.get("a:10"))

  @mock.patch('ggrc.utils.memcache.MEMCACHE_MAX_ITEM_SIZE', 5)
  @mock.patch('ggrc.utils.memcache._encode_data', lambda a: a)
  @mock.patch('ggrc.utils.memcache._decode_data', lambda a: a)
  def test_update(self):
    """Test blob set/set operation"""
    # set cache which will be split to 3 chunks (5+5+1 bytes)
    memcache.blob_set(self.memcache_client, "a", "01234567890")
    # set cache with 2 chunks (5+2 bytes)
    memcache.blob_set(self.memcache_client, "a", "abcdefg")

    result = memcache.blob_get(self.memcache_client, "a")
    self.assertEqual(result, "abcdefg")

  @mock.patch('ggrc.utils.memcache.MEMCACHE_MAX_ITEM_SIZE', 5)
  @mock.patch('ggrc.utils.memcache._encode_data', lambda a: a)
  @mock.patch('ggrc.utils.memcache._decode_data', lambda a: a)
  def test_blob_set_in_namespace(self):
    """Test blob set/get operation in namespace"""
    # set cache which will be split to 3 chunks (5+5+1 bytes)
    memcache.blob_set(self.memcache_client, "a", "01234567890", namespace="n")
    result = memcache.blob_get(self.memcache_client, "a", namespace="n")
    self.assertEqual(result, "01234567890")
    self.assertEqual(self.memcache_client.get("a", namespace="n"),
                     ["a:0", "a:5", "a:10"])
    self.assertEqual(self.memcache_client.get("a:0", namespace="n"), "01234")

  @mock.patch('ggrc.utils.memcache.MEMCACHE_MAX_ITEM_SIZE', 5)
  @mock.patch('ggrc.utils.memcache._encode_data', lambda a: a)
  @mock.patch('ggrc.utils.memcache._decode_data', lambda a: a)
  def test_update_namespace(self):
    """Test blob_set() removes chunks from correct namespace"""
    # set cache which will be split to 3 chunks (5+5+1 bytes)
    memcache.blob_set(self.memcache_client, "a", "01234567890", namespace="n")
    # set cache with 2 chunks (5+2 bytes), which must remove previous chunks
    memcache.blob_set(self.memcache_client, "a", "abcdefg", namespace="n")

    result = memcache.blob_get(self.memcache_client, "a:10", namespace="n")
    # Ensure that chunk are removed from correct namespace
    self.assertIsNone(result)
