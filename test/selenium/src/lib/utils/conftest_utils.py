# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""PyTest fixture utils."""
import os

from lib.constants import path


class DevLogRetriever(object):
  """A class to retrieve logs from the dev server.
  Only logs added between class initialization and retrieval are returned."""
  # pylint: disable=too-few-public-methods

  def __init__(self, filename):
    self.path = path.LOGS_DIR + filename
    self.position = os.stat(self.path).st_size

  def get_added_logs(self):
    """Return logs appeared in the file since object instantiation"""
    with open(self.path, "r") as log_file:
      log_file.seek(self.position)
      contents = log_file.read()
      self.position = log_file.tell()
      return contents
