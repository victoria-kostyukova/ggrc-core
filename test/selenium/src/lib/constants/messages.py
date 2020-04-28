# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Constants and procedures to make formatted messages."""
import copy

from lib.entities.entity import Entity


class CommonMessages(object):
  """Class contains constants and methods to make messages."""
  # pylint: disable=too-few-public-methods
  err_common = "\nExpected:\n{}\n\nActual:\n{}\n"
  err_contains = "\nExpected:\n{}\n\nin\n\nActual:\n{}\n"


class AssertionMessages(CommonMessages):
  """Class contains constants and methods to make messages after assertion
  procedures.
  """
  # pylint: disable=invalid-name
  AUTOMAPPING_IN_CHANGE_LOG = ("Automapping of {obj_name} should be tracked in"
                               " the 'Change log' tab")
  OBJS_SHOULD_BE_MAPPED_TO_OBJ = ("{mapped_objs_names} should be mapped to"
                                  " {src_obj_name}")
  TAB_WITH_NUM_SHOULD_EXIST = "{tab_name} tab with number {num} should exist."
  MEGA_PROGRAM_ICON = "Blue flag icon should appear near the {title} title"
  ITEM_CHECKBOX_SHOULD_BE_DISABLED = ("{obj_name} item checkbox should be "
                                      "disabled.")

  _line = "\n-----\n"
  _double_diff = "\nExpected:\n{}\nActual:\n{}\n"
  _triple_diff = "\nExpected:\n{}\nActual First:\n{}\nActual Second:\n{}\n"
  err_two_entities_diff = (
      _line + "\nFULL:" + _double_diff + "\nSAME:" + _double_diff + "\nDIFF:" +
      _double_diff)
  err_three_entities_diff = (
      _line + "\nFULL:" + _triple_diff + "\nSAME:" + _triple_diff + "\nDIFF:" +
      _triple_diff)

  @classmethod
  def diff_error_msg(cls, left, right):
    """Return formatted error message for two entities."""
    return cls.err_two_entities_diff.format(
        left, right, left.diff_info["equal"], right.diff_info["equal"],
        left.diff_info["diff"], right.diff_info["diff"])

  @classmethod
  def is_entities_have_err_info(cls, left, right):
    """Check if entities are instances of entities and have needed attributes
    and keys to make result error comparison message.
    """
    return (
        isinstance(left, Entity.all_entities_classes()) and
        isinstance(right, Entity.all_entities_classes()) and
        hasattr(left, "diff_info") and hasattr(right, "diff_info") and
        getattr(left, "diff_info") and getattr(right, "diff_info"))

  @classmethod
  def set_entities_diff_info(cls, left, right):
    """Get and set entities diff info attributes info."""
    comparison = Entity.compare_entities(left, right)
    left.diff_info = comparison["self_diff"]
    right.diff_info = comparison["other_diff"]

  @classmethod
  def _get_lists_comparison_err_msg(cls, left, right):
    """Return error message after assert equal comparison of lists."""
    assertion_error_msg = ""
    if len(left) != len(right):
      assertion_error_msg = (
          "\nThe lengths of lists are not equal. Length of expected list - {}."
          " Length of actual list - {}\n".format(len(left), len(right)) +
          cls.err_common.format(left, right))
    else:
      for _left, _right in zip(left, right):
        if not cls.is_entities_have_err_info(_left, _right):
          cls.set_entities_diff_info(_left, _right)
        assertion_error_msg += cls.diff_error_msg(_left, _right)
    return assertion_error_msg

  @classmethod
  def format_err_msg_equal(cls, left, right):
    """Return customized and detailed error message after assert equal
    comparison.
    """
    # comparison of entities
    assertion_error_msg = cls.err_common.format(left, right)
    # processing of entity
    if (isinstance(left, Entity.all_entities_classes()) and
            isinstance(right, Entity.all_entities_classes())):
      if not cls.is_entities_have_err_info(left, right):
        cls.set_entities_diff_info(left, right)
      assertion_error_msg = cls.diff_error_msg(left, right)
    # processing list of entities
    if (isinstance(left, list) and isinstance(right, list) and
        all(isinstance(_left, Entity.all_entities_classes()) and
        isinstance(_right, Entity.all_entities_classes()) for
            _left, _right in zip(left, right))):
      assertion_error_msg = cls._get_lists_comparison_err_msg(left, right)
    return assertion_error_msg

  @classmethod
  def format_err_msg_contains(cls, left, right):
    """Return customized and detailed error message after assert contains
    comparison.
    """
    # comparison of entities
    assertion_error_msg = cls.err_contains.format(left, right)
    # processing of entity
    if (isinstance(left, Entity.all_entities_classes()) and
            isinstance(right, Entity.all_entities_classes())):
      if not cls.is_entities_have_err_info(left, right):
        cls.set_entities_diff_info(left, right)
      assertion_error_msg = cls.diff_error_msg(left, right)
    # processing list of entities
    if (isinstance(left, Entity.all_entities_classes()) and
            isinstance(right, list) and
            all(isinstance(_right, Entity.all_entities_classes())
                for _right in right)):
      assertion_error_msg = ""
      for _right in right:
        left = copy.copy(left)
        if not cls.is_entities_have_err_info(left, _right):
          cls.set_entities_diff_info(left, _right)
        assertion_error_msg = (assertion_error_msg +
                               cls.diff_error_msg(left, _right))
    return assertion_error_msg


class ExceptionsMessages(CommonMessages):
  """Class contains constants and methods to make messages after exceptions
  procedures.
  """
  # pylint: disable=too-few-public-methods
  err_value_of_argument = "The argument does not contain numbers\n"
  err_switch_to_new_window = "New window target doesn't exist\n"
  err_csv_format = "CSV file has unexpected structure: {}\n"
  err_comments_count = "Comments's count." + CommonMessages.err_common
  err_server_req_resp = ("Server request body:\n{}\n"
                         "Server response text:\ncode: {}, message: {}\n")
  err_server_resp = "Server response (is not correct):\n{}\n"
  err_pagination_count = "Count of pagination controllers is not {}\n"
  err_pagination_elements = "Pagination controllers were not found {}\n"
  err_counters_are_different = (
      "Counter: {} is different to another counter: {}\n")
  err_results_are_different = (
      "Expected result: {} is different to Actual result: {}\n")
