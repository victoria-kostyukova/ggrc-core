# Copyright (C) 2019 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Handlers for Issue Tracker fields"""

import re

from ggrc.converters import errors
from ggrc.converters.handlers import handlers
from ggrc.integrations import constants
from ggrc.models import all_models
from ggrc.models.hooks.issue_tracker import \
    issue_tracker_params_container as params_container


class IssueTrackerColumnHandler(handlers.ColumnHandler):
  """Column handler used for Issue Tracker related fields.

  This class provides method for Issue Tracker fields export and Issue Tracker
  default values.
  """

  def get_value(self):
    return self.row_converter.issue_tracker.get(self.key, "")

  def set_obj_attr(self):
    if not self.value:
      self.value = self._get_default_value()
    if self.dry_run or not self.value:
      return
    self.row_converter.issue_tracker[self.key] = self.value

  def _get_default_value(self):
    """Get default value for missed value in Issue Tracker attribute column.

    We have some rules for default values.
    - Assessment and Assessment Template should take their missing values
      from audit if there, otherwise from default values.
    - Issues should have Issue specific hotlist_id and it's stored in separate
      'issue_hotlist_id' key.
    """
    value = None
    default_values = constants.DEFAULT_ISSUETRACKER_VALUES
    is_assmt = isinstance(self.row_converter.obj,
                          all_models.Assessment)
    is_assmt_template = isinstance(self.row_converter.obj,
                                   all_models.AssessmentTemplate)
    is_issue = isinstance(self.row_converter.obj, all_models.Issue)
    if is_assmt or is_assmt_template:
      value = self.row_converter.obj.audit.issue_tracker.get(self.key)

    if is_issue and (self.key == "hotlist_id"):
      value = default_values.get("issue_hotlist_id")

    default_value = value or default_values.get(self.key)
    return default_value


class IssueTrackerWithValidStates(IssueTrackerColumnHandler):
  """Column handler for columns with available valid states"""

  available_items = {
      "issue_type":
          params_container.IssueTrackerParamsContainer.AVAILABLE_TYPES,
      "issue_priority":
          params_container.IssueTrackerParamsContainer.AVAILABLE_PRIORITIES,
      "issue_severity":
          params_container.IssueTrackerParamsContainer.AVAILABLE_SEVERITIES,
  }

  def __init__(self, row_converter, key, **options):
    self.valid_states = self.available_items.get(key)
    super(IssueTrackerWithValidStates, self).__init__(row_converter,
                                                      key,
                                                      **options)

  def parse_item(self):
    value = self.raw_value.upper()
    if value not in self.valid_states:
      self.add_warning(errors.WRONG_VALUE_DEFAULT,
                       column_name=self.display_name)
      return None
    return value


class IssueTrackerAddsColumnHandler(IssueTrackerColumnHandler):
  """Column handler for hotlist and components ids"""

  def parse_item(self):
    try:
      value = int(self.raw_value)
    except ValueError:
      self.add_warning(errors.WRONG_VALUE_DEFAULT,
                       column_name=self.display_name)
      return None
    return value


class IssueTrackerTitleColumnHandler(IssueTrackerColumnHandler):
  """Column handler for Issue title for IssueTracked models"""

  def get_value(self):
    return self.row_converter.issue_tracker.get("title", "")

  def parse_item(self):
    """ Remove multiple spaces and new lines from text """
    value = self.raw_value or ""
    value = self.clean_whitespaces(value)
    if not value:
      value = self.row_converter.obj.title or \
          self.row_converter.attrs["title"].value
      self.add_warning(errors.WRONG_VALUE_DEFAULT,
                       column_name=self.display_name)
    return value

  @staticmethod
  def clean_whitespaces(value):
    """Change multiply whitespaces with single one in the value string."""
    return re.sub(r"\s+", " ", value)

  def set_obj_attr(self):
    if self.dry_run or not self.value:
      return
    self.row_converter.issue_tracker["title"] = self.value


class IssueTrackerEnabledHandler(IssueTrackerColumnHandler):
  """Column handler for ticket tracker integration column.

  Enabled flag stored as tinyint(1) in our DB.
  """

  _true = "on"
  _false = "off"

  TRUE_VALUES = {_true, }
  FALSE_VALUES = {_false, }

  NOT_ALLOWED_STATUSES = {"Fixed", "Fixed and Verified", "Deprecated"}

  def set_obj_attr(self):
    if self.dry_run:
      return
    self.row_converter.issue_tracker[self.key] = self.value

  def get_value(self):
    if self.row_converter.issue_tracker.get(self.key, ""):
      return self._true
    return self._false

  def _needs_status_check(self):
    """Check if we should check status before turn integration On.

    According to our business rules we shouldn't generate tickets for Issues
    in some statuses. We can turn integration On for all already linked Issues.
    """
    is_issue = isinstance(self.row_converter.obj, all_models.Issue)
    has_issue_id = self.row_converter.obj.issue_tracker.get("issue_id")
    if is_issue and not has_issue_id:
      return True
    return False

  def _get_status(self):
    """Get Issue Status.

    First it would check if status was imported during current import.
    Otherwise tries to get status from object.
    """
    imported_status = self.row_converter.attrs.get("status")
    attrs_status_value = imported_status.value if imported_status else None
    return attrs_status_value or self.row_converter.obj.status

  def parse_item(self):
    value = self.raw_value.strip().lower()
    if value in self.TRUE_VALUES:
      if self._needs_status_check():
        status = self._get_status()
        if status in self.NOT_ALLOWED_STATUSES:
          self.add_warning(errors.WRONG_TICKET_STATUS,
                           column_name=self.display_name)
          return False
      return True
    if value not in self.FALSE_VALUES:
      self.add_warning(errors.WRONG_VALUE_DEFAULT,
                       column_name=self.display_name)
    return False
