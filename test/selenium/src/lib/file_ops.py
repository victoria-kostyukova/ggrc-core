# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Path and file settings."""

import os


def get_unique_postfix(file_path, extension):
  """Add numeric postfix for file."""
  postfix = 0
  new_path = file_path + str(postfix) + extension

  while os.path.isfile(new_path):
    postfix += 1
    new_path = file_path + str(postfix) + extension

  return new_path
