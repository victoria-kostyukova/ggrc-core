# -*- coding: utf-8 -*-

# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests for the ggrc.notifications.notification_handlers module."""

import datetime
import unittest

import ddt
import mock
import pytz

from ggrc.notifications import data_handlers


@ddt.ddt
class TestAsUserTime(unittest.TestCase):
  """Tests for the as_user_time() helper function."""
  # pylint: disable=invalid-name

  def test_converting_dst_timestamp(self):
    """Test converting timestamps in daylight saving time part of the year."""
    timestamp = datetime.datetime(2017, 6, 13, 15, 40, 37)
    result = data_handlers.as_user_time(timestamp)
    self.assertEqual(result, "06/13/2017 08:40:37 PDT")

  def test_converting_non_dst_timestamp(self):
    """Test converting timestamps in non-daylight saving time part of the year.
    """
    timestamp = datetime.datetime(2017, 2, 13, 15, 40, 37)
    result = data_handlers.as_user_time(timestamp)
    self.assertEqual(result, "02/13/2017 07:40:37 PST")

  def test_converting_custom_timezone(self):
    """Test converting timestamp with custom timezone."""
    timestamp = datetime.datetime(2019, 1, 15, 12, 00, 00)
    result = data_handlers.as_user_time(
        timestamp,
        datetime_tz=pytz.timezone("US/Eastern")
    )
    self.assertEqual(result, "01/15/2019 07:00:00 EST")

  def test_converting_custom_format(self):
    """Test converting timestamp with custom format."""
    timestamp = datetime.datetime(2019, 1, 15, 12, 00, 00)
    result = data_handlers.as_user_time(
        timestamp,
        datetime_format="%m/%d/%Y %I:%M:%S %p %z"
    )
    self.assertEqual(result, "01/15/2019 04:00:00 AM -0800")

  def test_converting_formatter(self):
    """Test converting timestamp with additional formatter function."""
    timestamp = datetime.datetime(2019, 1, 15, 12, 00, 00)
    result = data_handlers.as_user_time(
        timestamp,
        datetime_format="%m/%d/%Y %I:%M:%S %p %z",
        formatter="Timestamp {}".format,
    )
    self.assertEqual(result, "Timestamp 01/15/2019 04:00:00 AM -0800")

  @ddt.data(
      {
          "role_ids": [1, 2, 3],
          "new_acl": [{"ac_role_id": 1, "person_id": 1},
                      {"ac_role_id": 2, "person_id": 2},
                      {"ac_role_id": 3, "person_id": 3}],
          "old_acl": [{"ac_role_id": 1, "person_id": 1},
                      {"ac_role_id": 2, "person_id": 2},
                      {"ac_role_id": 3, "person_id": 3}],
          "expected_role_ids": [],
      },
      {
          "role_ids": [1, 2, 3, 4, 5],
          "new_acl": [{"ac_role_id": 1, "person_id": 1},
                      {"ac_role_id": 2, "person_id": 2},
                      {"ac_role_id": 3, "person_id": 3}],
          "old_acl": [{"ac_role_id": 1, "person_id": 1},
                      {"ac_role_id": 2, "person_id": 2},
                      {"ac_role_id": 3, "person_id": 3}],
          "expected_role_ids": [],
      },
      {
          "role_ids": [1],
          "new_acl": [{"ac_role_id": 1, "person_id": 1},
                      {"ac_role_id": 2, "person_id": 2},
                      {"ac_role_id": 3, "person_id": 3}],
          "old_acl": [{"ac_role_id": 1, "person_id": 1},
                      {"ac_role_id": 2, "person_id": 2},
                      {"ac_role_id": 3, "person_id": 3}],
          "expected_role_ids": [],
      },
      {
          "role_ids": [1],
          "new_acl": [{"ac_role_id": 1, "person_id": 1},
                      {"ac_role_id": 2, "person_id": 2},
                      {"ac_role_id": 3, "person_id": 3}],
          "old_acl": [],
          "expected_role_ids": [1],
      },
      {
          "role_ids": [1],
          "new_acl": [],
          "old_acl": [{"ac_role_id": 1, "person_id": 1},
                      {"ac_role_id": 2, "person_id": 2},
                      {"ac_role_id": 3, "person_id": 3}],
          "expected_role_ids": [1],
      },
      {
          "role_ids": [1, 2, 3],
          "new_acl": [{"ac_role_id": 1, "person_id": 1},
                      {"ac_role_id": 2, "person_id": 2},
                      {"ac_role_id": 3, "person_id": 3}],
          "old_acl": [],
          "expected_role_ids": [1, 2, 3],
      },
      {
          "role_ids": [1, 2, 3],
          "new_acl": [],
          "old_acl": [{"ac_role_id": 1, "person_id": 1},
                      {"ac_role_id": 2, "person_id": 2},
                      {"ac_role_id": 3, "person_id": 3}],
          "expected_role_ids": [1, 2, 3],
      },
      {
          "role_ids": [1],
          "new_acl": [{"ac_role_id": 1, "person_id": 4},
                      {"ac_role_id": 2, "person_id": 5},
                      {"ac_role_id": 3, "person_id": 6}],
          "old_acl": [{"ac_role_id": 1, "person_id": 1},
                      {"ac_role_id": 2, "person_id": 2},
                      {"ac_role_id": 3, "person_id": 3}],
          "expected_role_ids": [1],
      },
  )
  @ddt.unpack
  def test_get_updated_roles(self,
                             role_ids,
                             new_acl,
                             old_acl,
                             expected_role_ids):
    """Get updated roles geenrator call."""
    roles = {r_id: mock.Mock() for r_id in role_ids}
    expected_role = {roles[i] for i in expected_role_ids}
    # pylint: disable=protected-access
    actual_role = set()
    for act_role in data_handlers._get_updated_roles(new_acl, old_acl, roles):
      actual_role.add(act_role[0])
    self.assertEqual(expected_role, actual_role)
