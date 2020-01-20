# -*- coding: utf-8 -*-

# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Module with tests for HTML cleaner."""

import unittest
import ddt

from ggrc.utils import html_cleaner


@ddt.ddt
class TestHTMLCleaner(unittest.TestCase):
  """Test html_cleaner functions."""

  def setUp(self):
    """Set up for test cases."""
    self.cleaner = html_cleaner.cleaner

  @ddt.data(
      ("simple text", "simple text"),
      ("&adp; invalid html entity &*!;", "&adp; invalid html entity &*!;"),
      ("&amp; html entity", "& html entity"),
      ("&(n; &(;; ordered mix &(n; &(;;", "&(n; &(;; ordered mix &(n; &(;;"),
      ("<invalid>unsupported tags</invalid>", "unsupported tags"),
      ("<b>supported tags</b>", "<b>supported tags</b>"),
      ("<b href='glg.com'>attrs from list</b>",
       "<b href=\"glg.com\">attrs from list</b>"),
      ("<b unr='non'>invalid attrs</b>", "<b>invalid attrs</b>"),
  )
  @ddt.unpack
  def test_cleaner(self, value, expected):
    """Test html_cleaner.cleaner function"""
    returned = self.cleaner("dummy", value)
    self.assertEqual(expected, returned)
