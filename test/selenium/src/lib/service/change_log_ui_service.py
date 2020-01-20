# coding=utf-8
# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Services for working with Change Log via UI."""

from lib import base, factory
from lib.constants import objects, element
from lib.page.widget import change_log
from lib.utils import ui_utils


class ChangeLogService(base.WithBrowser):
  """Class for Change Log business layer's services objects."""

  def open_obj_changelog_tab(self, obj):
    """Open obj info page and open changelog tab of an obj.
    Returns:
      ReadonlyChangeLog element for disabled objects or ChangeLog element for
      other objects."""
    info_page = factory.get_cls_webui_service(objects.get_plural(obj.type))(
        self._driver).open_info_page_of_obj(obj)
    info_page.tabs.ensure_tab(element.TabContainer.CHANGE_LOG_TAB)
    ui_utils.wait_for_spinner_to_disappear()
    return (change_log.ChangeLog()
            if objects.get_plural(obj.type) not in objects.DISABLED_OBJECTS
            else change_log.ReadonlyChangeLog())

  def get_obj_changelog(self, obj):
    """Returns object Change Log as list of ChangeLogItemEntity instances."""
    return self.open_obj_changelog_tab(obj).get_changelog_items()
