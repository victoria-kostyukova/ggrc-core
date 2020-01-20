# -*- coding: utf-8 -*-

# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

import unittest
from mock import patch

from ggrc import app  # noqa
from ggrc.notifications import common


class TestNotificationsInit(unittest.TestCase):

  @patch("ggrc.notifications.common.deleted_task_rels_cache")
  @patch("ggrc.notifications.common.cycle_tasks_cache")
  @patch("ggrc.notifications.common.custom_attributes_cache")
  @patch("ggrc.notifications.common.get_filter_data")
  def test_get_notification_data(self, get_filter_data, ca_cache,
                                 *cache_mocks):
    """ Test that data does not contain empty emails """
    ca_cache.return_value = None
    for cache_func in cache_mocks:
      cache_func.return_value = {}

    get_filter_data.return_value = {
        "email@example.com": {},
        "": {},
    }
    notification_data = common.get_notification_data([1, 2])
    self.assertIn("email@example.com", notification_data)
    self.assertNotIn("", notification_data)
