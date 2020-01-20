# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""This module contains url parser class."""
import re

from HTMLParser import HTMLParser


class UrlHTMLParser(HTMLParser, object):
  """Class for parsing and wrapping urls."""
  LINK_TAG = "a"
  URL_REGEX = r"https?:\/\/[^\s]+"
  HTML_LINK_FORMAT = u'<a href="{link}">{text}</a>'

  def __init__(self):
    super(UrlHTMLParser, self).__init__()
    self.tags_stack = []
    self.raw_data = ""
    self.pattern = re.compile(self.URL_REGEX)

  def feed(self, data):
    if not data:
      return data
    self.tags_stack = []
    self.raw_data = data
    super(UrlHTMLParser, self).feed(data)
    return self.raw_data

  def handle_starttag(self, tag, attrs):
    self.tags_stack.append(tag)

  def handle_endtag(self, tag):
    if self.tags_stack and self.tags_stack[-1] == tag:
      self.tags_stack.pop(-1)

  def handle_data(self, data):
    if not self.tags_stack or self.tags_stack[-1] != self.LINK_TAG:
      filtered_data = []
      prev_end_index = 0
      for occur in self.pattern.finditer(data):
        url = occur.group()
        filtered_data.append(data[prev_end_index:occur.start()])
        filtered_data.append(self.HTML_LINK_FORMAT.format(link=url, text=url))
        prev_end_index = occur.start() + len(url)
      if filtered_data:
        filtered_data.append(data[prev_end_index:])
        self.raw_data = self.raw_data.replace(data, ''.join(filtered_data))


def parse(data):
  """Parses and wraps urls in the data provided."""
  return UrlHTMLParser().feed(data)
