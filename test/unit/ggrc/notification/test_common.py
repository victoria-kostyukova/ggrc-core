# -*- coding: utf-8 -*-

# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests for the ggrc.notifications.common module."""

import unittest
from datetime import datetime

import mock

from ggrc.notifications import common


class TestSortComments(unittest.TestCase):
  """Tests for the as_user_time() helper function."""
  # pylint: disable=invalid-name

  def test_sorts_comments_inline_newest_first(self):
    """Test that comments data is sorted by creation date (descending)."""
    asmt5_info = (5, "Assessment", "Asmt 5", "www.5.com")

    data = {
        "comment_created": {
            asmt5_info: {
                12: {
                    "description": "ABCD...",
                    "created_at": datetime(2017, 5, 31, 8, 15, 0)
                },
                19: {
                    "description": "All tasks can be closed",
                    "created_at": datetime(2017, 10, 16, 0, 30, 0)
                },
                10: {
                    "description": "Comment One",
                    "created_at": datetime(2017, 5, 29, 16, 20, 0)
                },
                15: {
                    "description": "I am confused",
                    "created_at": datetime(2017, 8, 15, 11, 13, 0)
                }
            }
        }
    }

    common.sort_comments(data)

    comment_data = data["comment_created"].values()[0]
    self.assertIsInstance(comment_data, list)

    descriptions = [c["description"] for c in comment_data]
    expected_descriptions = [
        "All tasks can be closed", "I am confused", "ABCD...", "Comment One"
    ]
    self.assertEqual(descriptions, expected_descriptions)

  def test_get_daily_notification_huge_data(self):
    """Test that we do not loose any notifications during merging chunks"""
    notif_list = mock.MagicMock(return_value=None)

    content = [(notif_list, {"user@example.com": {"notif": {"id": 1}}}),
               (notif_list, {"user@example.com": {"notif 2": {"id": 1}}}),
               (notif_list, {"test@example.com": {"notif": {"id": 1}}})]

    expected_data = {"test@example.com": {"notif": {"id": 1}},
                     "user@example.com": {"notif": {"id": 1},
                                          "notif 2": {"id": 1}}}

    with mock.patch("ggrc.notifications.common.generate_daily_notifications",
                    return_value=content):
      _, notif_data = common.get_daily_notifications()
      self.assertEqual(expected_data, notif_data)


class TestSendMailLocally(unittest.TestCase):
  """Test mail sending in local server"""

  def test_send_mail_no_raises(self):
    """Test check if send mail"""

    user_email = "user@example.com"
    subject = "Test subject"
    body = "Test body"

    try:
      common.send_email(user_email, subject, body)
    except AssertionError as error:
      self.fail(error)
