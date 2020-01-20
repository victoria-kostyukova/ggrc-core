# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests for GDrive utils."""

import unittest

from ggrc.gdrive.file_actions import _generate_new_file_name


class TestGDriveUtils(unittest.TestCase):
  """Test for GDrive utils"""

  def test_generate_new_file_name(self):
    """Test test_generate_new_file_name method"""
    folder_id = '123abc'
    expected = "File name (2)"
    files_list = [{"parents": [folder_id], "name": "File name"},
                  {"parents": [folder_id], "name": "File name (1)"}]
    actual = _generate_new_file_name(files_list=files_list,
                                     original_name="File name",
                                     folder_id=folder_id)
    self.assertEqual(expected, actual)
