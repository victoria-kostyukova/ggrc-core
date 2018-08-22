# -*- coding: utf-8 -*-

# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests for the ggrc.notifications.job_emails module."""

import unittest
from mock import patch

import ddt

from ggrc import settings
from ggrc.notifications.job_emails import send_email


@ddt.ddt
class TestJobEmails(unittest.TestCase):
  """Tests for checking notification when export"""

  @classmethod
  def setUpClass(cls):
    cls.template = {
        "title": "title",
        "body": "body",
        "url": "export"
    }
    cls.user_email = "user@example.com"
    cls.subject = "title"

  @ddt.data(
      (42, "export#!&job_id=42"),
      (561, "export#!&job_id=561"),
      (None, "export")
  )
  @ddt.unpack
  def test_url_in_notification(self, ie_id, url):
    """Test for checking url in notification when exporting"""

    with patch("ggrc.notifications.common.send_email") as common_send_email:
      data = {
          "body": self.template["body"],
          "title": self.template["title"],
          "url": url
      }
      body = settings.EMAIL_IMPORT_EXPORT.render(
          import_export=data
      )

      send_email(self.template, self.user_email, "", "", ie_id)
      common_send_email.assert_called_with(
          self.user_email, self.subject, body
      )
