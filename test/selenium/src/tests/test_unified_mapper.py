# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Unified mapper tests."""
# pylint: disable=no-self-use
# pylint: disable=invalid-name
# pylint: disable=redefined-outer-name
# pylint: disable=unused-argument

import pytest

from lib import base, browsers, url
from lib.app_entity_factory import regulation_entity_factory
from lib.constants import objects
from lib.entities.entity import Representation
from lib.page.modal import unified_mapper
from lib.service import webui_service, webui_facade


@pytest.fixture()
def regulation(selenium):
  """Creates regulation object."""
  return regulation_entity_factory.RegulationFactory().create()


class TestProgramPage(base.Test):
  """Tests of unified mapper."""

  @pytest.mark.smoke_tests
  def test_destructive_mapping_controls_to_program_via_unified_mapper(
      self, program, controls, selenium
  ):
    """Check if Controls can be mapped to Program from Controls widget under
    Program page via unified mapper.
    Preconditions:
    - Program, Controls created via REST API.
    """
    expected_controls = [
        expected_control.repr_ui() for expected_control
        in controls]
    controls_ui_service = webui_service.ControlsService(selenium)
    controls_ui_service.map_objs_via_tree_view(
        src_obj=program, dest_objs=expected_controls)
    actual_controls_tab_count = controls_ui_service.get_count_objs_from_tab(
        src_obj=program)
    assert len(expected_controls) == actual_controls_tab_count
    actual_controls = controls_ui_service.get_list_objs_from_tree_view(
        src_obj=program)
    # 'actual_controls': created_at, updated_at, custom_attributes (None)
    self.general_equal_assert(
        sorted(expected_controls), sorted(actual_controls),
        *Representation.tree_view_attrs_to_exclude)

  def test_no_modal_for_program_control(self, login_as_creator, program,
                                        selenium):
    """Tests that 'New Control' modal is not opened
    when creator adds control to a program."""
    programs_service = webui_service.ProgramsService(selenium)
    programs_service.open_info_page_of_obj(program)
    obj_modal = programs_service.add_and_map_obj_widget(objects.CONTROLS)
    assert not obj_modal.is_present, ("'New Control' modal "
                                      "should not be present.")

  def test_user_cannot_map_control_to_scope_ojbects_via_add_tab(
          self, control, soft_assert, selenium):
    """Tests that user cannot map control to scope objects/directives
    via 'Add Tab' menu."""
    service = webui_service.ControlsService(selenium)
    controls_info_widget = service.open_info_page_of_obj(control)
    controls_info_widget.click_add_tab_btn()
    hidden_items = controls_info_widget.get_hidden_items_from_add_tab()
    for h_item in hidden_items:
      controls_info_widget.click_add_tab_btn()
      h_item.click()
      soft_assert.expect(webui_facade.are_tabs_urls_equal(),
                         "Tabs urls should be equal.")
      webui_facade.soft_assert_no_modals_present(
          unified_mapper.BaseUnifiedMapperModal(), soft_assert)
      old_tab, new_tab = browsers.get_browser().windows()
      old_tab.use()
      new_tab.close()
    soft_assert.assert_expectations()


class TestControlsPage(base.Test):
  """Tests of unified mapper for Controls."""

  def test_user_cannot_map_control_via_unified_mapper(self, control,
                                                      dashboard_controls_tab,
                                                      selenium):
    """Tests that user cannot map Control to Scope Objects/Directives
    via Unified Mapper (existent new scope/directive object)"""
    dashboard_controls_tab.get_control(control).select_map_to_this_object()
    map_modal = webui_facade.map_object_via_unified_mapper(
        selenium=selenium, obj_name=objects.CONTROLS,
        dest_objs_type=objects.get_singular(plural=objects.PRODUCTS,
                                            title=True),
        return_tree_items=False,
        open_in_new_frontend=True)
    browsers.get_browser().windows()[1].use()
    assert not map_modal.is_present, (
        "There should be no modal windows in new browser tab.")

  def test_cannot_map_control_via_um_create_new_obj(self, control, regulation,
                                                    dashboard_controls_tab,
                                                    soft_assert, selenium):
    """Tests that user cannot map control to scope objects/directives
    via unified mapper (create a new scope/directive object)."""
    dashboard_controls_tab.get_control(control).select_map_to_this_object()
    map_modal = webui_facade.map_object_via_unified_mapper(
        selenium=selenium, obj_name=objects.CONTROLS,
        dest_objs_type=objects.get_singular(plural=objects.REGULATIONS,
                                            title=True),
        obj_to_map=regulation, proceed_in_new_tab=True)
    new_tab = browsers.get_browser().windows()[1]
    soft_assert.expect(new_tab.url == url.Urls().dashboard_info_tab,
                       "Dashboard info page should be opened in new tab.")
    soft_assert.expect(
        not(objects.get_normal_form(objects.REGULATIONS)
            in webui_service.ControlsService(selenium).open_info_page_of_obj(
            control).top_tabs.tab_names),
        "There should be no scope/directive object mapped to Control.")
    new_tab.use()
    soft_assert.expect(not map_modal.is_present,
                       "There should be no modal windows in new browser tab.")
    soft_assert.assert_expectations()
