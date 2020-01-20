# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Unit tests for assessment integration helper methods."""
# pylint: disable=protected-access,too-many-arguments

import datetime
import itertools
import unittest

from mock import patch
import ddt

from ggrc.integrations import constants as integration_constants
from ggrc.models.hooks.issue_tracker import assessment_integration


@ddt.ddt
class AsmtIntegrationTest(unittest.TestCase):
  """Test helper methods used in assessment integration with Issue Tracker."""

  @ddt.data(
      (["same@example.com"], ["same@example.com"], True),
      (["same@example.com"], ["other@example.com"], False),
  )
  @ddt.unpack
  def test_is_ccs_same(self, ccs_ggrc, ccs_tracker, same):
    """Test _is_ccs_same works correctly."""
    asmt_handler = assessment_integration.AssessmentTrackerHandler
    payload_ggrc = {"ccs": ccs_ggrc}
    payload_tracker = {"ccs": ccs_tracker}

    self.assertEqual(
        same,
        asmt_handler._is_ccs_same(
            payload_ggrc,
            payload_tracker,
        ),
    )

  @ddt.data(
      (
          {"due_date": datetime.date(2019, 8, 21)},
          {"Due Date": "2019-08-21"},
          True,
      ),
      (
          {"due_date": datetime.date(2019, 8, 21)},
          {"Due Date": "2019-08-22"},
          False,
      ),
  )
  @ddt.unpack
  def test_is_custom_fields_same(self, custom_ggrc, custom_tracker, same):
    """Test _is_common_fields_same works correctly."""
    asmt_handler = assessment_integration.AssessmentTrackerHandler
    custom_ggrc = asmt_handler._generate_custom_fields(custom_ggrc)
    custom_tracker = [custom_tracker]
    payload_ggrc = {"custom_fields": custom_ggrc}
    payload_tracker = {"custom_fields": custom_tracker}

    custom_fields_same, _ = asmt_handler.custom_fields_processing(
        payload_ggrc,
        payload_tracker,
    )

    self.assertEqual(same, custom_fields_same)

  @ddt.data(
      *[
          ({field: value_ggrc}, {field: value_tracker}, same)
          for field, (value_ggrc, value_tracker, same) in itertools.product(
              integration_constants.COMMON_SYNCHRONIZATION_FIELDS,
              [("same", "same", True), ("same", "other", False)],
          )
      ]
  )
  @ddt.unpack
  def test_is_common_fields_same(self, payload_ggrc, payload_tracker, same):
    """Test _is_common_fields_same works correctly."""
    asmt_handler = assessment_integration.AssessmentTrackerHandler
    self.assertEqual(
        same,
        asmt_handler._is_common_fields_same(
            payload_ggrc,
            payload_tracker,
        ),
    )

  @patch.object(
      assessment_integration.AssessmentTrackerHandler,
      "_is_ccs_same",
  )
  @patch.object(
      assessment_integration.AssessmentTrackerHandler,
      "_is_common_fields_same",
  )
  @patch.object(
      assessment_integration.AssessmentTrackerHandler,
      "custom_fields_processing",
  )
  @ddt.data(
      *[
          (custom_same, common_same, ccs_same)
          for custom_same, common_same, ccs_same in itertools.product(
              [True, False],
              repeat=3,
          )
      ]
  )
  @ddt.unpack
  def test_is_need_sync(self, custom_same, common_same, ccs_same,
                        custom_mock, common_mock, ccs_mock):
    """Test _is_need_sync works correctly.

    Test that assessment needs to be synced with Issue Tracker when either ccs,
    common or custom fields differ.
    """
    asmt_handler = assessment_integration.AssessmentTrackerHandler()
    custom_mock.return_value = (custom_same, True)
    common_mock.return_value = common_same
    ccs_mock.return_value = ccs_same
    assessment_id = 0

    self.assertEqual(
        not all([custom_same, common_same, ccs_same]),
        asmt_handler._is_need_sync(
            assessment_id=assessment_id,
            issue_payload={"status": "Not Started"},
            issue_tracker_info={"status": "ASSIGNED"}),
    )
