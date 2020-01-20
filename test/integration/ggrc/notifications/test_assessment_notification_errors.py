# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests of assessment notifications when errur occures."""
from collections import OrderedDict

import ddt
from mock import mock

from ggrc.models import all_models
from integration.ggrc import TestCase, api_helper, generator
from integration.ggrc.models import factories

# pylint: disable=invalid-name,too-many-lines


@ddt.ddt
class TestAssessmentNotification(TestCase):
  """Tests of assessment notification in case of error"""

  def setUp(self):
    self.api = api_helper.Api()

  def test_notification_cav_error(self):
    """Exception in notification shouldn't leads to broken import"""
    assessment = factories.AssessmentFactory()
    assessment_slug = assessment.slug

    mock_target = "ggrc.notifications.get_updated_cavs"
    with mock.patch(mock_target) as updated_cavs_mock:
      updated_cavs_mock.side_effect = KeyError()
      response = self.import_data(
          OrderedDict(
              [
                  ("object_type", "Assessment"),
                  ("Code*", assessment_slug),
                  ("Title", "updated title"),
              ]
          )
      )
    self.assertEquals([], response[0]['row_errors'])

  def test_notification_attribute_error(self):
    """Exception in notification shouldn't leads to broken import"""
    assessment = factories.AssessmentFactory()
    assessment_slug = assessment.slug

    with mock.patch(
        "ggrc.notifications.notification_handlers."
        "_get_unsent_notification"
    ) as unsent_notification_mock:
      unsent_notification_mock.side_effect = AttributeError(
          "'NoneType' object has no attribute 'id'"
      )
      response = self.import_data(
          OrderedDict(
              [
                  ("object_type", "Assessment"),
                  ("Code*", assessment_slug),
                  ("Title", "updated title"),
              ]
          )
      )
    self.assertEquals([], response[0]['row_errors'])

  def test_notification_create_assessment_error(self):
    """Exception in notification shouldn't leads to 500 resp"""
    audit = factories.AuditFactory()
    with mock.patch(
        "ggrc.notifications.notification_handlers."
        "handle_assignable_created"
    ) as mocked_func:
      mocked_func.side_effect = Exception()
      response = self.api.post(
          all_models.Assessment, {
              "assessment": {
                  "title": "Assessment1",
                  "context": None,
                  "audit": {
                      "id": audit.id,
                      "type": audit.type,
                  },
              }
          }
      )
      self.assert201(response)

  def test_notification_delete_assessment_error(self):
    """Exception in notification shouldn't leads to 500 resp"""
    assessment_id = factories.AssessmentFactory().id

    with mock.patch(
        "ggrc.notifications.notification_handlers."
        "handle_assignable_deleted"
    ) as mocked_func:
      mocked_func.side_effect = Exception()
      response = self.api.delete(
          all_models.Assessment.query.get(assessment_id)
      )
      self.assert200(response)

  def test_notification_assessment_reminder_error(self):
    """Exception in notification shouldn't leads to 500 resp"""
    assessment = factories.AssessmentFactory()
    with mock.patch(
        "ggrc.notifications.notification_handlers."
        "handle_reminder"
    ) as mocked_func:
      mocked_func.side_effect = Exception()
      response = self.api.modify_object(
          assessment, {"reminderType": "statusToPerson"}
      )
      self.assert200(response)

  def test_comment_notification_error(self):
    """Exception in comment notification shouldn't leads to 500 resp"""
    request_data = [
        {
            "comment": {
                "description": "some comment",
                "context": None,
                "assignee_type": "Assignees,Verifiers,Creators",
            },
        }
    ]
    with mock.patch(
        "ggrc.notifications.notification_handlers."
        "handle_comment_created"
    ) as mocked_func:
      mocked_func.side_effect = Exception()
      response = self.api.post(all_models.Comment, request_data)
    self.assert200(response)

  def test_relationship_notification_error(self):
    """Exception in relationship notification shouldn't leads to 500 resp"""
    gen = generator.ObjectGenerator()
    with factories.single_commit():
      assessment = factories.AssessmentFactory()
      comment = factories.CommentFactory()
    with mock.patch(
        "ggrc.notifications.notification_handlers."
        "handle_relationship_altered"
    ) as mocked_func:
      mocked_func.side_effect = Exception()
      response, relationship = gen.generate_relationship(assessment, comment)
      self.assert201(response)
      response = self.api.delete(relationship)
      self.assert200(response)
