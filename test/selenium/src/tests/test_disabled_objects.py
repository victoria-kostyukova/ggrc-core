# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Disabled objects tests."""

# pylint: disable=redefined-outer-name
import inflection
import pytest

from lib import base, browsers, factory, url
from lib.constants import element, objects
from lib.entities import entity
from lib.service import (rest_facade, webui_service, webui_facade,
                         change_log_ui_facade)
from lib.utils import test_utils


class TestDisabledObjects(base.Test):
  """Tests for disabled objects functionality.

  Test cases are parametrized with the type of objects under test.
  As there is too much disabled objects to test all of them, in each test case
  one object of each disabled objects section is used.
  """
  # pylint: disable=no-self-use
  # pylint: disable=invalid-name
  # pylint: disable=unused-argument

  @pytest.mark.smoke_tests
  @pytest.mark.parametrize("obj", objects.SINGULAR_CONTROL_AND_RISK +
                           [next(objects.SINGULAR_SCOPE_OBJS_ITERATOR)],
                           indirect=True)
  def test_cannot_edit_or_del_disabled_obj_from_info_page(
      self, obj, selenium, soft_assert
  ):
    """Confirm that user cannot edit or delete disabled object from
    info page."""
    three_bbs = factory.get_cls_webui_service(objects.get_plural(
        obj.type))().open_info_page_of_obj(obj).three_bbs
    soft_assert.expect(not three_bbs.edit_option.exists,
                       "'Edit' option should not be available.")
    soft_assert.expect(not three_bbs.delete_option.exists,
                       "'Delete' option should not be available.")
    soft_assert.assert_expectations()

  @pytest.mark.smoke_tests
  @pytest.mark.parametrize("obj", objects.SINGULAR_CONTROL_AND_RISK +
                           [next(objects.SINGULAR_SCOPE_OBJS_ITERATOR)],
                           indirect=True)
  def test_cannot_edit_disabled_object_from_tree_view(self, obj, selenium,):
    """Confirm that user cannot edit disabled object from tree view."""
    assert not factory.get_cls_webui_service(objects.get_plural(
        obj.type))().is_obj_editable_via_tree_view(obj), (
        "Edit option should not be available for disabled object in tree view")

  @pytest.mark.smoke_tests
  @pytest.mark.parametrize("obj", objects.SINGULAR_CONTROL_AND_RISK +
                           [next(objects.SINGULAR_SCOPE_OBJS_ITERATOR)],
                           indirect=True)
  def test_cannot_edit_or_del_disabled_obj_from_gl_search(
      self, obj, header_dashboard, soft_assert
  ):
    """Confirm that user cannot edit or delete disabled object from
    global search."""
    three_bbs = (header_dashboard.open_global_search().search_obj(obj).
                 get_three_bbs(obj.type))
    soft_assert.expect(not three_bbs.edit_option.exists,
                       "'Edit' option should not be available.")
    soft_assert.expect(not three_bbs.delete_option.exists,
                       "'Delete' option should not be available.")
    soft_assert.assert_expectations()

  @pytest.mark.smoke_tests
  @pytest.mark.parametrize("obj", objects.SINGULAR_CONTROL_AND_RISK,
                           indirect=True)
  def test_cannot_make_and_view_proposals_for_disabled_obj(
      self, obj, soft_assert, selenium
  ):
    """Confirm that user cannot make and view Proposals for disabled object."""
    info_page = factory.get_cls_webui_service(objects.get_plural(
        obj.type))().open_info_page_of_obj(obj)
    webui_facade.soft_assert_cannot_make_proposal(info_page, soft_assert)
    webui_facade.soft_assert_cannot_view_proposals(info_page, soft_assert)
    soft_assert.assert_expectations()

  @pytest.mark.smoke_tests
  @pytest.mark.parametrize("obj", objects.SINGULAR_CONTROL_AND_RISK,
                           indirect=True)
  def test_cannot_restore_disabled_object_version(self, obj, soft_assert,
                                                  selenium):
    """Confirm that user cannot restore disabled object's version."""
    webui_facade.soft_assert_cannot_view_version_history(obj, soft_assert)
    soft_assert.assert_expectations()

  @pytest.mark.smoke_tests
  @pytest.mark.parametrize("obj", objects.SINGULAR_CONTROL_AND_RISK +
                           [next(objects.SINGULAR_SCOPE_OBJS_ITERATOR)],
                           indirect=True)
  def test_object_export(self, obj, create_tmp_dir, selenium):
    """Confirm that object can be exported and exported data is correct."""
    actual_objects = webui_facade.export_objects(
        path_to_export_dir=create_tmp_dir,
        obj_type=obj.type)
    self.general_contain_assert(
        obj.repr_ui(), actual_objects,
        *entity.Representation.tree_view_attrs_to_exclude)

  @pytest.mark.smoke_tests
  @pytest.mark.parametrize("obj", objects.SINGULAR_CONTROL_AND_RISK +
                           [next(objects.SINGULAR_SCOPE_OBJS_ITERATOR)],
                           indirect=True)
  def test_disabled_obj_change_log_tab(self, obj, soft_assert, selenium):
    """Check disabled object's Log tab is valid."""
    change_log_ui_facade.soft_assert_obj_creation_entry_is_valid(
        obj, soft_assert)
    change_log_ui_facade.soft_assert_disabled_obj_log_tab_elements_are_valid(
        obj, soft_assert)
    soft_assert.assert_expectations()

  @pytest.mark.smoke_tests
  @pytest.mark.parametrize("obj", objects.SINGULAR_CONTROL_AND_RISK +
                           [next(objects.SINGULAR_SCOPE_OBJS_ITERATOR)],
                           indirect=True)
  def test_user_cannot_add_person_to_custom_role(self, obj, selenium,
                                                 soft_assert):
    """Tests that user cannot add a person to custom Role."""
    webui_facade.soft_assert_role_cannot_be_edited(soft_assert, obj)
    soft_assert.expect(webui_facade.are_tabs_urls_equal(),
                       "Urls should be equal.")
    soft_assert.assert_expectations()

  @pytest.mark.smoke_tests
  @pytest.mark.parametrize("obj", objects.SINGULAR_CONTROL_AND_RISK +
                           [next(objects.SINGULAR_SCOPE_OBJS_ITERATOR)],
                           indirect=True)
  def test_user_cannot_update_custom_attribute(self, obj, selenium,
                                               soft_assert):
    """Tests that user cannot update custom attribute."""
    cad = rest_facade.create_gcad(
        definition_type=inflection.underscore(obj.type),
        attribute_type=element.AdminWidgetCustomAttributes.RICH_TEXT)
    soft_assert.expect(
        not factory.get_cls_webui_service(objects.get_plural(
            obj.type))().has_gca_inline_edit(obj, ca_title=cad.title),
        "GCA field should not be editable.")
    soft_assert.expect(webui_facade.are_tabs_urls_equal(),
                       "Tabs urls should be equal.")
    soft_assert.assert_expectations()

  @pytest.mark.smoke_tests
  @pytest.mark.parametrize("obj", objects.SINGULAR_CONTROL_AND_RISK +
                           [next(objects.SINGULAR_SCOPE_OBJS_ITERATOR)],
                           indirect=True)
  def test_user_cannot_update_predefined_field(self, obj, selenium,
                                               soft_assert):
    """Tests that user cannot update predefined field."""
    webui_facade.soft_assert_cannot_update_predefined_field(soft_assert, obj)
    soft_assert.expect(webui_facade.are_tabs_urls_equal(),
                       "Urls should be equal.")
    soft_assert.assert_expectations()

  @pytest.mark.smoke_tests
  @pytest.mark.parametrize("obj", objects.SINGULAR_CONTROL_AND_RISK +
                           [next(objects.SINGULAR_SCOPE_OBJS_ITERATOR)],
                           indirect=True)
  @pytest.mark.parametrize("mapped_obj",
                           [objects.get_singular(objects.STANDARDS),
                            objects.get_singular(objects.REGULATIONS),
                            next(objects.SINGULAR_SCOPE_OBJS_ITERATOR)],
                           indirect=True)
  def test_cannot_unmap_disabled_obj(self, obj, mapped_obj, selenium):
    """Check that user cannot unmap disabled object from "mapped_obj" and new
    tab opens."""
    webui_service.BaseWebUiService(
        objects.get_plural(obj.type)).open_info_panel_of_mapped_obj(
            mapped_obj, obj).three_bbs.select_unmap_in_new_frontend()
    _, new_tab = browsers.get_browser().windows()
    test_utils.wait_for(lambda: new_tab.url.endswith(url.Widget.INFO))
    expected_url = mapped_obj.url + url.Widget.INFO
    assert new_tab.url == expected_url

  @pytest.mark.smoke_tests
  @pytest.mark.parametrize("obj", objects.SINGULAR_CONTROL_AND_RISK,
                           indirect=True)
  def test_review_details_for_disabled_obj(self, obj, selenium):
    """Check that new browser tab is displayed after clicking Review
    Details button for objects disabled in GGRC."""
    factory.get_cls_webui_service(objects.get_plural(
        obj.type))().open_info_page_of_obj(obj).click_review_details_btn()
    assert webui_facade.are_tabs_urls_equal(), "Tabs urls should be equal."

  @pytest.mark.smoke_tests
  @pytest.mark.parametrize("obj", objects.SINGULAR_CONTROL_AND_RISK,
                           indirect=True)
  def test_disabled_obj_review_buttons(self, obj, soft_assert, selenium):
    """Check that buttons 'Mark Reviewed' and 'Request Review' are not
    displayed at disabled object Info page."""
    info_page = factory.get_cls_webui_service(objects.get_plural(
        obj.type))().open_info_page_of_obj(obj)
    soft_assert.expect(not info_page.mark_reviewed_btn.exists,
                       "There should be no 'Mark Reviewed' button.")
    soft_assert.expect(not info_page.request_review_btn.exists,
                       "There should be no 'Request Review button.")
    soft_assert.assert_expectations()

  @pytest.mark.smoke_tests
  @pytest.mark.parametrize("obj", objects.SINGULAR_CONTROL_AND_RISK +
                           [next(objects.SINGULAR_SCOPE_OBJS_ITERATOR)],
                           indirect=True)
  def test_cannot_add_comment(self, obj, soft_assert, selenium):
    """Check that user can't add a comment:
    - input field is not displayed
    - "Add Comment" button is not displayed for Scope objects and opens a new
     browser tab for other disabled objects."""
    info_page = factory.get_cls_webui_service(
        objects.get_plural(obj.type))().open_info_page_of_obj(obj)
    webui_facade.soft_assert_cannot_add_comment(soft_assert, info_page)
    soft_assert.assert_expectations()

  @pytest.mark.parametrize("obj", objects.SINGULAR_CONTROL_AND_RISK +
                           [next(objects.SINGULAR_SCOPE_OBJS_ITERATOR)],
                           indirect=True)
  def test_cannot_upd_disabled_obj_status(self, obj, selenium):
    """Check that user cannot update disabled object status."""
    factory.get_cls_webui_service(objects.get_plural(
        obj.type))().open_info_page_of_obj(obj).status_label.click_edit()
    assert webui_facade.are_tabs_urls_equal(), "Tabs urls should be equal."
