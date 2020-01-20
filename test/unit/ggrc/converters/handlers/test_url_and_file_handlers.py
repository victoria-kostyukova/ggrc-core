# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Tests for the EvidenceFileHandler and EvidenceUrlHandler classes"""

import unittest
import ddt
from ggrc.converters.handlers.evidence import EvidenceFileHandler
from ggrc.converters.handlers.document import DocumentFileHandler


# pylint: disable=too-few-public-methods
@ddt.ddt
class HandlerTestCase(object):
  """Base class for test method"""

  @ddt.data(
      ('', ''), ('url', 'url'), ('url title', 'url'),
      ('url and long title ', 'url')
  )
  @ddt.unpack
  def test_parse_line(self, raw_value, expected_result):
    """Test parsing a single line"""
    # pylint: disable=protected-access
    result = self.target._parse_line(raw_value)
    self.assertEqual(result, expected_result)


class EvidenceFileHandlerTestCase(unittest.TestCase, HandlerTestCase):
  """Base class for EvidenceFileHandler tests"""
  target = EvidenceFileHandler


class DocumentFileHandlerTestCase(unittest.TestCase, HandlerTestCase):
  """Base class for DocumentFileHandler tests"""
  target = DocumentFileHandler
