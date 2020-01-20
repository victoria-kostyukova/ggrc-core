# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests if error handling is done correctly"""

from integration.ggrc import TestCase
from ggrc.utils import errors


class TestErrorHandlers(TestCase):

  def test_non_flask_error_handling(self):
    response = self.import_file("not_a_csv.txt", safe=False)
    self.assertEqual(response["message"], errors.WRONG_FILE_TYPE)
