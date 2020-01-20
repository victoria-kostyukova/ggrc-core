# -*- coding: utf-8 -*-

# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Unit test suite for util url_parser."""

import unittest
import ddt

from ggrc.utils import url_parser


@ddt.ddt
class TestUrlParser(unittest.TestCase):
  """Unittests for user generator module."""

  @ddt.data(
      [
          "https://www.google.com/",
          '<a href="https://www.google.com/">https://www.google.com/</a>'
      ],
      [
          "http://www.google.com/",
          '<a href="http://www.google.com/">http://www.google.com/</a>'
      ],
      [
          "http://www.google.com",
          '<a href="http://www.google.com">http://www.google.com</a>'
      ],
      [
          u"http://www.тест.com",
          u'<a href="http://www.тест.com">http://www.тест.com</a>'
      ],
  )
  @ddt.unpack
  def test_wrap_raw_url(self, test_data, expected_result):
    """Url parser should wrap urls (http or hhtps)."""
    self.assertEqual(url_parser.parse(test_data), expected_result)

  @ddt.data('<a href="https://www.google.com/">https://www.google.com/</a>',
            '<a href="http://www.google.com/">http://www.google.com/</a>')
  def test_not_wraps_links(self, data):
    """Url parser should not change wrapped urls."""
    self.assertEqual(url_parser.parse(data), data)

  @ddt.data([
      ('test <a href="https://www.google.com/">'
       'https://www.google.com/</a> link http://www.google.com/'),
      ('test <a href="https://www.google.com/">'
       'https://www.google.com/</a> link '
       '<a href="http://www.google.com/">http://www.google.com/</a>')
  ], [
      (u'тест <a href="https://www.тест.com/">тест</a> '
       u'тест http://тест.com/'),
      (u'тест <a href="https://www.тест.com/">тест</a> '
       u'тест <a href="http://тест.com/">http://тест.com/</a>')
  ])
  @ddt.unpack
  def test_parse_mixed_urls(self, test_data, expected_result):
    """ Url parser should parse a string with both
        wrapped and not wrapped urls.
    """
    self.assertEqual(url_parser.parse(test_data), expected_result)

  @ddt.data(["<a>https://www.google.com/",
             "<a>https://www.google.com/"],
            ["http://www.google.com/</a>",
             ('<a href="http://www.google.com/">'
              'http://www.google.com/</a></a>')])
  @ddt.unpack
  def test_parse_broken_tags(self, test_data, expected_result):
    """Url parser should work with invalid tags."""
    self.assertEqual(url_parser.parse(test_data), expected_result)

  @ddt.data(None, "")
  def test_parse_empty_values(self, test_data):
    """Url parser should ignore None values and empty strings."""
    self.assertEqual(url_parser.parse(test_data), test_data)
