# coding=utf-8
# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Facade for working with Change Log via UI."""
# pylint: disable=invalid-name

from lib import browsers, url
from lib.entities import entities_factory
from lib.service import webui_facade, change_log_ui_service
from lib.utils import test_utils


def soft_assert_obj_creation_entry_is_valid(obj, soft_assert):
  """Perform soft assertion that change log of newly created object
  is valid."""
  expected_entry = (entities_factory.ChangeLogItemsFactory().
                    generate_obj_creation_entity(obj))
  actual_entry = (change_log_ui_service.ChangeLogService().
                  open_obj_changelog_tab(obj).get_object_creation_entry())
  soft_assert.expect(
      expected_entry == actual_entry,
      "Actual object creation log entry differs from expected:\nExpected: {}\n"
      "Actual: {}".format(expected_entry.changes, actual_entry.changes))


def soft_assert_disabled_obj_log_tab_elements_are_valid(obj, soft_assert):
  """Perform soft assertion that elements displayed at change log tab of
  disabled object are valid."""
  log = change_log_ui_service.ChangeLogService().open_obj_changelog_tab(obj)
  soft_assert.expect(log.is_log_message_displayed,
                     "Message for disabled objects log is not displayed.")
  log.open_change_log_in_new_fe()
  new_tab = browsers.get_browser().windows()[1]
  test_utils.wait_for(lambda: new_tab.url.endswith(url.Widget.INFO))
  soft_assert.expect(webui_facade.are_tabs_urls_equal(),
                     "Tabs urls should be equal.")
