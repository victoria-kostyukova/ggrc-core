# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Change log tab smoke tests."""
# pylint: disable=no-self-use
# pylint: disable=unused-argument
import pytest

from lib import base, users
from lib.constants import element
from lib.entities import entities_factory, entity
from lib.service import change_log_ui_service, webui_facade, rest_facade
from lib.utils import random_utils


class TestChangeLobTab(base.Test):
  """Tests for change log tab in object's info page/panel."""

  exp_page_sizes = base.Pagination.PAGE_SIZES

  @pytest.fixture
  def change_log_with_changes(self, program, request):
    """Creates some number (through parametrizing this fixture indirectly)
    of title changes in object and returns expected change log items."""
    num_of_changes = request.param
    change_log_items = [entities_factory.ChangeLogItemsFactory().
                        generate_obj_creation_entity(program)]
    for _ in xrange(num_of_changes - len(change_log_items)):
      new_title = random_utils.get_string()
      change_log_items.append(entity.ChangeLogItemEntity(
          author=users.current_user().email,
          changes=[{"attribute_name": element.Common.TITLE.lower(),
                    "original_value": program.title,
                    "new_value": new_title}]))
      rest_facade.update_object(program, title=new_title)
    return change_log_items

  @pytest.mark.smoke_tests
  @pytest.mark.parametrize(
      'change_log_with_changes', [exp_page_sizes[1] + 1], indirect=True)
  def test_change_log_w_several_pages(
      self, program, selenium, soft_assert, change_log_with_changes
  ):
    """Checks items in change log with several pages.

    We add such number of changes so we can check different kinds of
    pagination."""
    change_log_tab = (change_log_ui_service.ChangeLogService().
                      open_obj_changelog_tab(program))
    webui_facade.soft_assert_pagination(
        soft_assert, change_log_tab.pagination, self.exp_page_sizes[0],
        self.exp_page_sizes)
    default_page_size_change_log = change_log_tab.get_changelog_items()
    change_log_tab.pagination.change_page_size(
        page_size=self.exp_page_sizes[1])
    webui_facade.soft_assert_pagination(
        soft_assert, change_log_tab.pagination, self.exp_page_sizes[1],
        self.exp_page_sizes)
    modified_page_size_change_log = change_log_tab.get_changelog_items()
    soft_assert.expect(
        change_log_with_changes[::-1] == default_page_size_change_log ==
        modified_page_size_change_log, 'Change log items are not equal')
    soft_assert.assert_expectations()
