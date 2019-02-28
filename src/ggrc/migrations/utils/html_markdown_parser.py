# Copyright (C) 2019 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Module with tools to move from html to markdown."""

from HTMLParser import HTMLParser


class HTML2MarkdownParser(HTMLParser, object):
  """HTMLParser for moving html text to markdown.

    1) Will replace html links <a href="..."> with markdown links (...)[...]
    2) Will replace <li> with dash sign "-" and </li> as newline symbol "\n"
    3) Will replace <br> with newline symbol
    4) Will remove other html tags (<strong>, <i> and others).

    self.fed - is a cleaned data without html tags.
  """

  LINK_TAG = "a"
  LIST_TAG = "li"
  IMAGE_TAG = "img"
  BR_TAG = "br"
  NEWLINE = "\n"

  def __init__(self):
    """Initialize parser."""
    super(HTML2MarkdownParser, self).__init__()
    self.parsed_data = []
    self.tags_stack = []
    self.current_link = None
    self.current_link_data = []

  def feed(self, data):
    if not data:
      return data
    self.tags_stack = []
    self.current_link = None
    self.current_link_data = []
    self.parsed_data = []
    super(HTML2MarkdownParser, self).feed(data)
    return self.get_data()

  def get_data(self):
    """Get data after parsing."""
    return u''.join(self.parsed_data)

  def handle_endtag(self, tag):
    """Handle ending html tag"""
    lower_tag = tag.lower()
    if lower_tag == self.BR_TAG or lower_tag == self.LIST_TAG:
      self.parsed_data.append(self.NEWLINE)
    elif lower_tag == self.LINK_TAG:
      data = ''.join(self.current_link_data)
      self.parsed_data.append("[" + data + "]"
                              if not data.isspace() else "[link]")
      self.parsed_data.append(self.current_link)
      self.current_link_data = []
      self.current_link = None
    if self.tags_stack and self.tags_stack[-1] == lower_tag:
      self.tags_stack.pop(-1)

  def handle_starttag(self, tag, attrs):
    """Handle starting html tag."""
    lower_tag = tag.lower()
    self.tags_stack.append(lower_tag)
    attrs_dict = {key: value for key, value in attrs}
    if lower_tag == self.LINK_TAG:
      href = attrs_dict.get('href', '')
      self.current_link = "(" + href + ")" if href else ''
    elif lower_tag == self.LIST_TAG:
      self.parsed_data.append('- ')
    elif lower_tag == self.BR_TAG:
      self.parsed_data.append(self.NEWLINE)
    elif lower_tag == self.IMAGE_TAG:
      src = attrs_dict.get('src', '')
      self.parsed_data.append(src)

  def handle_data(self, data):
    """Handle data inside or outside tags."""
    if not self.tags_stack and data:
      self.parsed_data.append(data)
    else:
      if self.tags_stack[-1] == self.LINK_TAG:
        self.current_link_data.append(data)
      else:
        self.parsed_data.append(data)
