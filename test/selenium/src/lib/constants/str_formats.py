# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Constants for making formatted strings."""
from lib.utils import string_utils

MENTIONED_EMAIL = string_utils.Symbols.PLUS + "{email} "
MAILTO = "mailto:{email}"
CHANGE_LOG_MAPPING_MSG = "Mapping to {obj_name}: {obj_title}"
CHANGE_LOG_AUTOMAPPING_MSG = ("automapping triggered after {user_name} mapped "
                              "{mapped_obj_name} \"{mapped_obj_title}\" to "
                              "{src_obj_name} \"{src_obj_title}\"")
TAB_WITH_NUM = '{tab_name} ({num})'  # for e.g. 'People (1)'
