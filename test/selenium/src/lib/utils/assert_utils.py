# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Assert utils."""
# pylint: disable=invalid-name
import pytest

from lib.utils import string_utils


class Error(object):
  """Class for errors."""
  # pylint: disable=too-few-public-methods

  def __init__(self, message, is_reproduced=True):
    self.message = message
    self.is_reproduced = is_reproduced

  def __str__(self):
    return self.message


class SoftAssert(object):
  """Class for performing soft asserts."""

  def __init__(self):
    self.__errors = []
    self.__reproduced_expected_errors = []
    self.__not_reproduced_expected_errors = []

  def expect(self, expression, message, is_expected_error=False):
    """If error is not expected, tries to perform assert and in case of failure
    stores error into error list. If error is expected, determines whether it
    is reproduced or not."""
    if not is_expected_error:
      try:
        assert expression, message
      except AssertionError:
        self.__errors.append(Error(message))
    else:
      self._handle_expected_error(Error(message, is_reproduced=expression))

  def assert_expectations(self):
    """Performs assert that there were no soft_assert errors.

    Effects:
      - Pass if there were no any errors;
      - AssertionError if there are any unexpected errors;
      - Fail if there are not reproduced expected errors (to let know that they
        were fixed);
      - Xfail if there are only reproduced expected errors.
    """
    assert not self.__errors, (self._get_errors_msg() +
                               self._get_reproduced_expected_errors_msg() +
                               self._get_not_reproduced_expected_errors_msg())
    self._check_not_reproduced_expected_errors()
    self._check_reproduced_expected_errors()

  def _handle_expected_error(self, error):
    """Determines where to store expected error."""
    if error.is_reproduced:
      self.__reproduced_expected_errors.append(error)
    else:
      self.__not_reproduced_expected_errors.append(error)

  def _get_errors_msg(self):
    """Returns error message with the list of errors."""
    return ("\n\nThere were some errors during soft_assert:\n {}\n".format(
            string_utils.convert_list_to_str(self.__errors)))

  def _get_reproduced_expected_errors_msg(self):
    """Returns error message with the list of reproduced expected errors."""
    return ("\nReproduced expected errors:\n {}\n".format(
            string_utils.convert_list_to_str(
                self.__reproduced_expected_errors))
            if self.__reproduced_expected_errors else '')

  def _get_not_reproduced_expected_errors_msg(self):
    """Returns error message with the list of not reproduced expected errors.
    """
    return ("\nNot reproduced expected errors:\n {}\n".format(
            string_utils.convert_list_to_str(
                self.__not_reproduced_expected_errors))
            if self.__not_reproduced_expected_errors else '')

  def _check_not_reproduced_expected_errors(self):
    """Fails if there are not reproduced expected errors in test."""
    if self.__not_reproduced_expected_errors:
      pytest.fail(msg=self._get_not_reproduced_expected_errors_msg() +
                  self._get_reproduced_expected_errors_msg())

  def _check_reproduced_expected_errors(self):
    """Xfails if there are reproduced expected errors in test."""
    if self.__reproduced_expected_errors:
      pytest.xfail(reason=self._get_reproduced_expected_errors_msg())
