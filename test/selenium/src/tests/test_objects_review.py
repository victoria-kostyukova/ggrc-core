# -*- coding: utf-8 -*-
# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Object review workflow tests."""
# pylint: disable=no-self-use
# pylint: disable=invalid-name
# pylint: disable=unused-argument
# pylint: disable=too-few-public-methods
# pylint: disable=too-many-arguments
# pylint: disable=redefined-outer-name
import copy

import pytest

from lib import base, users, factory
from lib.constants import objects, element
from lib.entities import entities_factory, entity
from lib.service import (webui_facade, rest_facade, webui_service,
                         emails_digest_service, change_log_ui_service)


class TestObjectsReview(base.Test):
  """Tests for objects review workflow."""

  @pytest.fixture()
  def program_with_review(self, second_creator, login_as_creator, program):
    """Returns program instance with assigned review."""
    return rest_facade.request_obj_review(program, second_creator)

  @pytest.fixture()
  def program_with_approved_review(self, second_creator, program_with_review):
    """Approve program review.
    Returns program instance with approved review."""
    users.set_current_user(second_creator)
    return rest_facade.approve_obj_review(program_with_review)

  @pytest.fixture()
  def program_w_approved_via_ui_review(self, second_creator,
                                       program_with_review, selenium):
    """Approve program review via UI.
    Returns program instance with approved review."""
    users.set_current_user(second_creator)
    return webui_facade.approve_obj_review(selenium, program_with_review)

  @pytest.mark.smoke_tests
  def test_request_obj_review(self, second_creator, login_as_creator, program,
                              selenium):
    """Confirm reviewer is displayed on Program Info panel."""
    webui_facade.submit_obj_for_review(selenium, program, second_creator)
    actual_program = webui_facade.get_object(selenium, program)
    self.general_equal_assert(program.repr_ui(), actual_program)

  @pytest.mark.smoke_tests
  def test_obj_mark_reviewed(self, second_creator, program_with_review,
                             selenium):
    """Confirm Reviewer with READ rights for an object
    able to Review an object."""
    users.set_current_user(second_creator)
    webui_facade.approve_obj_review(selenium, program_with_review)
    actual_program = webui_facade.get_object(selenium, program_with_review)
    self.general_equal_assert(program_with_review.repr_ui(), actual_program)

  @pytest.mark.smoke_tests
  def test_reviewed_obj_buttons_state(self, program_with_approved_review,
                                      selenium):
    """Confirm 'Mark reviewed' button is hidden and 'Request review' button is
    visible after review approval."""
    info_page = webui_service.ProgramsService(selenium).open_info_page_of_obj(
        program_with_approved_review)
    expected_buttons_state = {"is_mark_reviewed_btn_visible": False,
                              "is_request_review_btn_visible": True}
    actual_buttons_state = copy.deepcopy(expected_buttons_state)
    actual_buttons_state["is_mark_reviewed_btn_visible"] = (
        info_page.mark_reviewed_btn.exists)
    actual_buttons_state["is_request_review_btn_visible"] = (
        info_page.request_review_btn.exists)
    assert actual_buttons_state == expected_buttons_state

  @pytest.mark.smoke_tests
  def test_message_with_undo_btn_appears(self, second_creator,
                                         program_w_approved_via_ui_review,
                                         selenium):
    """Confirm floating message 'Review is complete' with 'Undo' button
    appears."""
    info_page = factory.get_cls_widget(
        objects.get_plural(program_w_approved_via_ui_review.type),
        is_info=True)(selenium)
    actual_elements_state = {
        "is_floating_message_visible": info_page.floating_message.exists,
        "is_undo_btn_visible": info_page.undo_button.exists}
    expected_elements_state = copy.deepcopy(actual_elements_state)
    expected_elements_state["is_floating_message_visible"] = True
    expected_elements_state["is_undo_btn_visible"] = True
    assert actual_elements_state == expected_elements_state

  @pytest.mark.smoke_tests
  def test_obj_history_is_updated(self, program_with_approved_review,
                                  selenium):
    """Confirm Review history is updated in Change Log."""
    actual_changelog = (change_log_ui_service.ChangeLogService().
                        get_obj_changelog(program_with_approved_review))
    expected_entry = entity.ChangeLogItemEntity(
        author=users.current_user().email,
        changes=[{"attribute_name":
                  (element.TransformationSetVisibleFields.REVIEW_STATUS.
                   replace(" ", "_").lower()),
                  "original_value": element.ReviewStates.UNREVIEWED,
                  "new_value": element.ReviewStates.REVIEWED}])
    assert (expected_entry == actual_changelog.pop(0) and
            expected_entry not in actual_changelog), (
        "Review history was not properly updated in Change Log.")

  @pytest.mark.smoke_tests
  def test_undo_obj_review_approval(self, program_w_approved_via_ui_review,
                                    selenium):
    """Confirm Reviewer with READ rights for an object is able to undo
    an object review approval."""
    webui_facade.undo_obj_review_approval(selenium,
                                          program_w_approved_via_ui_review)
    actual_program = webui_facade.get_object(selenium,
                                             program_w_approved_via_ui_review)
    self.general_equal_assert(program_w_approved_via_ui_review.repr_ui(),
                              actual_program)

  @pytest.mark.smoke_tests
  def test_request_obj_review_as_reviewer(self, second_creator, third_creator,
                                          program_with_review, selenium):
    """Confirm reviewer is able to request review from another person."""
    users.set_current_user(second_creator)
    webui_facade.submit_obj_for_review(selenium, program_with_review,
                                       third_creator)
    actual_program = webui_facade.get_object(selenium, program_with_review)
    self.general_equal_assert(program_with_review.repr_ui(), actual_program)

  @pytest.mark.smoke_tests
  def test_editor_can_undo_obj_review_approval(self, editor,
                                               program_with_approved_review,
                                               selenium):
    """Confirm user with EDIT rights is able to undo an object review
    approval."""
    users.set_current_user(editor)
    expected_program = webui_facade.cancel_review_by_editing_obj(
        selenium, program_with_approved_review)
    actual_program = webui_facade.get_object(selenium, expected_program)
    self.general_equal_assert(expected_program.repr_ui(), actual_program)

  @pytest.mark.smoke_tests
  def test_review_request_notification(self, second_creator,
                                       program_with_review, selenium):
    """Confirm user gets email notification when assigned as reviewer
    for an object."""
    users.set_current_user(entities_factory.PeopleFactory.superuser)
    expected_email = entity.ReviewEmailUI(
        recipient_email=second_creator.email,
        obj_type=program_with_review.type,
        obj_title=program_with_review.title)
    actual_emails = (emails_digest_service.ReviewDigestService().
                     get_review_request_emails())
    self.general_contain_assert(expected_email, actual_emails)

  @pytest.mark.smoke_tests
  def test_notification_of_reverted_review(self, second_creator,
                                           program_with_approved_review,
                                           selenium):
    """Confirm user gets email notification when object review reverted to
    'Unreviewed' state."""
    users.set_current_user(entities_factory.PeopleFactory.superuser)
    rest_facade.update_object(program_with_approved_review)
    expected_email = entity.ReviewEmailUI(
        recipient_email=second_creator.email,
        obj_type=program_with_approved_review.type,
        obj_title=program_with_approved_review.title)
    actual_emails = (
        emails_digest_service.ReviewDigestService().
        get_reverted_review_emails())
    self.general_contain_assert(expected_email, actual_emails)
