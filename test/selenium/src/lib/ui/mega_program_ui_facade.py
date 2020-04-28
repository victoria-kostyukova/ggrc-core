# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Mega program UI facade."""
# pylint: disable=invalid-name
# pylint: disable=too-many-arguments
from lib.constants import objects, messages
from lib.page.modal import unified_mapper
from lib.page.widget import object_modal, info_widget
from lib.service import webui_service, webui_facade
from lib.utils import ui_utils


def map_programs_via_add_tab_button(
    selenium, src_program, mapped_programs, map_as_parent=False
):
  """Maps to src_program mapped_programs as child(by default) or parent via
  Child/Parent Programs button from Add Tab dropdown.

  It works only for the first mapping of child or parent programs because
  there is no Child/Parent Programs button in Add Tab dropdown if we have
  mapped child or parent programs."""
  tab_name = (info_widget.Programs.PARENT_PROGRAMS_TAB_NAME if map_as_parent
              else info_widget.Programs.CHILD_PROGRAMS_TAB_NAME)
  webui_service.ProgramsService(selenium).open_tab_via_add_tab_btn(
      src_program, tab_name)
  (unified_mapper.MapProgramsToProgramModal(selenium, objects.PROGRAMS).
      map_dest_objs(
      dest_objs_type=mapped_programs[0].type.title(),
      dest_objs_titles=[program.title for program in mapped_programs]))
  object_modal.CommonConfirmModal().confirm()
  if map_as_parent:
    src_program.parents = mapped_programs
    for program in mapped_programs:
      program.children.append(src_program)
  else:
    src_program.children = mapped_programs
    for program in mapped_programs:
      program.parents.append(src_program)
  ui_utils.wait_for_spinner_to_disappear()


def soft_assert_mega_program_icon_exists(program, soft_assert):
  """Soft assert that mega program icon exists on info page of program."""
  info_page = webui_service.ProgramsService().open_info_page_of_obj(program)
  soft_assert.expect(
      info_page.mega_program_icon.exists,
      messages.AssertionMessages.MEGA_PROGRAM_ICON.format(title=program.title))


def soft_assert_programs_are_mapped(
    selenium, soft_assert, parent_program, child_program
):
  """Soft assert that Programs(Child) tab and Programs(Parent) tab appear on
  parent and child program info pages respectively with mapped programs and
  that tab number is updated."""
  info_page = webui_service.ProgramsService().open_info_page_of_obj(
      child_program)
  webui_facade.soft_assert_tab_with_number_exists(
      info_page, soft_assert, info_page.PARENT_PROGRAMS_TAB_NAME,
      len([parent_program]))
  webui_facade.soft_assert_objects_are_mapped(
      selenium, soft_assert, src_obj=child_program, objs=[parent_program],
      obj_name=objects.PROGRAM_PARENTS)
  info_page = webui_service.ProgramsService().open_info_page_of_obj(
      parent_program)
  webui_facade.soft_assert_tab_with_number_exists(
      info_page, soft_assert, info_page.CHILD_PROGRAMS_TAB_NAME,
      len([child_program]))
  webui_facade.soft_assert_objects_are_mapped(
      selenium, soft_assert, src_obj=parent_program, objs=[child_program],
      obj_name=objects.PROGRAM_CHILDS)


def soft_assert_mapping_program_and_automapping(
    selenium, soft_assert, src_program, mapped_program, mapped_obj, user,
    is_mapped_as_parent=False
):
  """Soft assert mapping of child program to parent program and parent program
  to child program and automapping of mapped to child program mapped_obj."""
  if is_mapped_as_parent:
    parent_program, child_program = mapped_program, src_program
  else:
    parent_program, child_program = src_program, mapped_program
  soft_assert_programs_are_mapped(
      selenium, soft_assert, parent_program, child_program)
  soft_assert_mega_program_icon_exists(parent_program, soft_assert)
  webui_facade.soft_assert_objects_are_mapped(
      selenium, soft_assert, src_obj=parent_program, objs=[mapped_obj])
  webui_facade.soft_assert_automapping_in_change_log(
      parent_program, child_program, mapped_obj, user, soft_assert)
