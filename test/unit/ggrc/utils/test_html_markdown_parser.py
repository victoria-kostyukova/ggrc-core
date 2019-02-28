# -*- coding: utf-8 -*-

# Copyright (C) 2019 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Module with tests for HTML parser."""

import unittest
import ddt

from ggrc.migrations.utils import html_markdown_parser


@ddt.ddt
class TestHTML2MarkdownParser(unittest.TestCase):
  """Test HTML2MarkdownParser class."""

  def setUp(self):
    """Set up for test cases."""
    super(TestHTML2MarkdownParser, self).setUp()
    self.parser = html_markdown_parser.HTML2MarkdownParser()

  def test_multiple_url(self):
    """Test parsing multiple urls in one html data."""
    data = (
        u'<p><a href="http://localhost:8080/sdfas">sdfas</a> '
        u'<a href="http://localhost:8080/adasdfasf">adasdfasf</a>'
        u' fsfasfae    '
        u'<a href="http://localhost:8080/sdfadf">sdfadf</a></p>'
        u'<ol><li>t4st</li><li>test</li></ol>'
        u'<p><br></p><p><br></p><p>TRTRTRT</p>'
    )
    expected_data = (
        u'[sdfas](http://localhost:8080/sdfas) '
        u'[adasdfasf](http://localhost:8080/adasdfasf) '
        u'fsfasfae    '
        u'[sdfadf](http://localhost:8080/sdfadf)'
        u'- t4st\n- test\n\n\nTRTRTRT'
    )
    self.parser.feed(data)
    self.assertEquals(self.parser.get_data(), expected_data)

  @ddt.data(
      (u'<a href="https://www.google.com/">some url</a>',
       u'[some url](https://www.google.com/)'),
      (u'<a href="https://www.google.com/">тест</a>',
       u'[тест](https://www.google.com/)'),
      (u'<a href="https://www.google.com/"> </a>',
       u'[link](https://www.google.com/)'),
      (u'<a href="https://www.google.com/">Some text</a>',
       u'[Some text](https://www.google.com/)'),
  )
  @ddt.unpack
  def test_parse_url(self, html_data, markdown_data):
    """Tests parsing html url."""
    self.parser.feed(html_data)
    self.assertEquals(self.parser.get_data(), markdown_data)

  @ddt.data(
      (u'<img src="https://www.google.com/"/>',
       u'https://www.google.com/'),
      (u'<img src=""/>', u''),
      (u'plain text <>', u'plain text <>'),
      (u'<strong>some </strong>text</br><tag> 111</tag>', u'some text\n 111'),
      (u'<h1>some text</h1><h2></h2><p> text</p>', u'some text text'),
  )
  @ddt.unpack
  def test_parse_html_tags(self, html_data, markdown_data):
    """Tests parsing html tags."""
    self.parser.feed(html_data)
    self.assertEquals(self.parser.get_data(), markdown_data)

  @ddt.data(
      (u'<ul><li>1</li><li>2</li></ul>', u'- 1\n- 2\n'),
      (u'<ol><li>1</li><li>2</li></ol>', u'- 1\n- 2\n'),
  )
  @ddt.unpack
  def test_parse_html_list(self, html_data, markdown_data):
    """Tests parsing html lists."""
    self.parser.feed(html_data)
    self.assertEquals(self.parser.get_data(), markdown_data)
