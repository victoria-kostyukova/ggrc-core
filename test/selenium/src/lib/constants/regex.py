# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Regular expressions for use in code."""

WIDGET_TITLE_AND_COUNT = r"(.*) \((.*)\)"
TEXT_W_PARENTHESES = r"\([^)]*\) "
TEXT_WO_PARENTHESES = r"\((.*?)\)"
ADDITIONAL_INFO_IN_CHANGE_LOG = r"\((.*?)\)$"  # handles inner closing brackets
