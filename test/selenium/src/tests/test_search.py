# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Search tests."""
# pylint: disable=no-self-use, invalid-name, unused-argument

from lib import base, users, factory
from lib.constants import objects
from lib.entities import entities_factory
from lib.service import webui_facade


class TestGlobalSearch(base.Test):
  """Tests of Global Search."""

  def test_admin_cannot_see_filter_of_creator(self, login_as_creator,
                                              control, selenium):
    """Check that created by Creator search is not available for Admin.
    """
    expected_search_title = webui_facade.open_dashboard(
        selenium).header.open_global_search().create_and_save_search(
        control)
    users.set_current_user(entities_factory.PeopleFactory.superuser)
    assert not (webui_facade.open_dashboard(selenium).header.
                open_global_search().saved_searches_area.
                get_search_by_title(expected_search_title).is_present())

  def test_saving_of_global_search(self, header_dashboard,
                                   program, programs, soft_assert):
    """Check saved searches are sorted by descending, saved search
    can be removed and permalink does not appear near the search."""
    search_modal = header_dashboard.open_global_search()
    programs.append(program)
    webui_facade.check_order_and_removing_of_searches(soft_assert, programs,
                                                      search_modal)
    soft_assert.expect(not (search_modal.saved_searches_area.saved_searches[0].
                            permalink.exists),
                       "Copy link should not be displayed.")
    soft_assert.assert_expectations()


class TestAdvancedSearch(base.Test):
  """Tests of Advanced Search."""

  def test_saving_of_advanced_search(self, selenium, soft_assert, program,
                                     controls_mapped_to_program,
                                     control_mapped_to_program):
    """Check saved searches are sorted by descending, saved search can be
    removed, permalink appears near the search and works."""
    search_modal = factory.get_cls_webui_service(objects.get_plural(
        control_mapped_to_program.type))().open_widget_of_mapped_objs(
        program).open_advanced_search()
    controls_mapped_to_program.append(control_mapped_to_program)
    webui_facade.check_order_and_removing_of_searches(
        soft_assert, controls_mapped_to_program, search_modal)
    webui_facade.check_advanced_search_permalink_works(
        soft_assert, search_modal, selenium, program,
        controls_mapped_to_program[1])
    soft_assert.assert_expectations()

  def test_link_of_search_in_three_dots_menu(self, selenium, program,
                                             controls_mapped_to_program,
                                             soft_assert):
    """Check that a permalink of created and applied search exists
    in three dots menu and works correctly."""
    obj_to_search = controls_mapped_to_program[0]
    page = factory.get_cls_webui_service(objects.get_plural(
        obj_to_search.type))().open_widget_of_mapped_objs(
        program)
    webui_facade.create_save_and_apply_advanced_search(page, obj_to_search)
    webui_facade.check_advanced_search_permalink_works(
        soft_assert, page, selenium, program, obj_to_search)
    soft_assert.assert_expectations()
