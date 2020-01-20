# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Search tests."""
# pylint: disable=no-self-use
# pylint: disable=invalid-name
from lib import base, users
from lib.entities import entities_factory
from lib.service import webui_facade


class TestGlobalSearch(base.Test):
  """Tests of Global Search."""

  def test_admin_cannot_see_filter_of_creator(self, login_as_creator,
                                              control, selenium):
    """Check that created by Creator search is not available for Admin.
    """
    # pylint: disable=unused-argument
    expected_search_title = (webui_facade.open_dashboard(selenium).
                             header.open_global_search().
                             create_and_save_search(control))
    users.set_current_user(entities_factory.PeopleFactory.superuser)
    assert (webui_facade.open_dashboard(selenium).header.
            open_global_search().saved_searches_area.is_search_present(
            expected_search_title) is False)
