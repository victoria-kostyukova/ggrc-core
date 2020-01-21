# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
# pylint: disable=invalid-name, protected-access

"""Test custom messages for issue tracker notifications during bulk verify."""

import unittest
from collections import namedtuple

import mock

from ggrc import settings
from ggrc.integrations.issuetracker_bulk_sync import IssueTrackerBulkUpdater


class TestImportConverterIssueTrackerUpdate(unittest.TestCase):
  """
      Test that bulk verify sets custom messages for
      notifications which are sent when linked issue tracker
      tickets are updated.
  """

  def setUp(self):
    from ggrc.converters import base

    self._converter = base.ImportConverter(
        ie_job=None,
        dry_run=True,
        csv_data={},
        bulk_import=False,
    )
    self._updater = IssueTrackerBulkUpdater()

  @mock.patch("ggrc.views.background_update_issues")
  def test_issues_update_is_called_with_custom_messages(self, bui_mock):
    """
        Test that ImportConverter passes custom messages to
        IssueTrackerBulkUpdater to be used for issue update
        notifications.
    """

    self._converter._start_issuetracker_update([1, 2, 3])

    bui_mock.assert_called_once_with(parameters={
        "revision_ids": [1, 2, 3],
        'mail_data': {'user_email': '', 'filename': ''},
        "notification_messages":
            self._converter._TICKET_UPDATE_NOTIFICATION_MESSAGES,
    })

  @mock.patch(
      "ggrc.integrations.issuetracker_bulk_sync."
      "IssueTrackerBulkUpdater.group_objs_by_type"
  )
  @mock.patch(
      "ggrc.integrations.issuetracker_bulk_sync."
      "IssueTrackerBulkUpdater.handle_issuetracker_sync"
  )
  @mock.patch(
      "ggrc.integrations.issuetracker_bulk_sync."
      "IssueTrackerBulkUpdater.send_notification"
  )
  def test_sync_issue_tracker_call_with_exception(self, send_mock,
                                                  his_mock, gobt_mock):
    """
      Test that custom error message is used even when exception is thrown
      while processing issues to update.
    """

    his_mock.return_value = True, []
    gobt_mock.return_value = {}

    updater = IssueTrackerBulkUpdater()

    updater.sync_issuetracker({
        "objects": [],
        "mail_data": {"user_email": "hello@world.com", "filename": "test.txt"},
        "notification_messages":
            self._converter._TICKET_UPDATE_NOTIFICATION_MESSAGES,
    })

    send_mock.assert_called_once_with(
        "test.txt",
        "hello@world.com",
        failed=True,
        notification_messages=self._converter.
          _TICKET_UPDATE_NOTIFICATION_MESSAGES,  # noqa
    )

  @mock.patch(
      "ggrc.integrations.issuetracker_bulk_sync."
      "IssueTrackerBulkUpdater.group_objs_by_type"
  )
  @mock.patch(
      "ggrc.integrations.issuetracker_bulk_sync."
      "IssueTrackerBulkUpdater.handle_issuetracker_sync"
  )
  @mock.patch(
      "ggrc.integrations.issuetracker_bulk_sync."
      "IssueTrackerBulkUpdater.send_notification"
  )
  def test_sync_issue_tracker_call_without_exception(
      self, send_mock, his_mock, gobt_mock
  ):
    """
      Test that custom error message is used during normal processing of issues
      to update.
    """

    his_mock.return_value = [True], []
    gobt_mock.return_value = {}

    self._updater.sync_issuetracker({
        "objects": [],
        "mail_data": {"user_email": "hello@world.com", "filename": "test.txt"},
        "notification_messages":
            self._converter._TICKET_UPDATE_NOTIFICATION_MESSAGES,
    })

    send_mock.assert_called_once_with(
        "test.txt",
        "hello@world.com",
        errors=[],
        notification_messages=self._converter.
            _TICKET_UPDATE_NOTIFICATION_MESSAGES,  # noqa
    )

  @mock.patch("ggrc.notifications.common.send_email")
  def test_send_notification_success(self, send_email_mock):
    """
      Test that email template shows custom messages after successful
      processing.
    """
    self._updater.send_notification(
        "test.txt",
        "hello@world.com",
        notification_messages=self._converter.
            _TICKET_UPDATE_NOTIFICATION_MESSAGES,  # noqa
    )

    send_email_mock.assert_called_once_with(
        "hello@world.com",
        self._updater.ISSUETRACKER_SYNC_TITLE,
        settings.EMAIL_BULK_SYNC_SUCCEEDED.render(
            sync_data={
                "title": "Ticket(s) update for your Bulk update action was "
                         "completed.",
                "email_text":
                    "The assessments from the Bulk update action that "
                    "required ticket(s) updates have been successfully "
                    "updated."
            }
        )
    )

  @mock.patch("ggrc.notifications.common.send_email")
  @mock.patch("ggrc.integrations.issuetracker_bulk_sync.get_object_url")
  def test_send_notification_errors(self, gou_mock, send_email_mock):
    """
      Test that email template shows custom messages when some of issues
      are not processed.
    """
    gou_mock.return_value = "/etc/hosts"

    self._updater.send_notification(
        "test.txt",
        "hello@world.com",
        errors=((namedtuple("Error", "slug title")(1, "Hello World"), False),),
        notification_messages=self._converter.
            _TICKET_UPDATE_NOTIFICATION_MESSAGES,  # noqa
    )

    sync_data = {
        "title": "There were some errors in updating ticket(s) for your "
                 "Bulk update action.",
        "email_text":
            "There were errors that prevented updates of some ticket(s) "
            "after the Bulk update action. The error may be due to your "
            "lack to sufficient access to generate/update the ticket(s)."
            " Here is the list of assessment(s) that was not updated.",
        "objects": [{
            "url": "/etc/hosts",
            "code": 1,
            "title": "Hello World",
        }]
    }

    send_email_mock.assert_called_once_with(
        "hello@world.com",
        self._updater.ISSUETRACKER_SYNC_TITLE,
        settings.EMAIL_BULK_SYNC_FAILED.render(
            sync_data=sync_data,
        )
    )

  @mock.patch("ggrc.notifications.common.send_email")
  @mock.patch("ggrc.integrations.issuetracker_bulk_sync.get_object_url")
  def test_send_notification_exception(self, gou_mock, send_email_mock):
    """
      Test that email template shows custom messages when exception is
      encountered.
    """

    gou_mock.return_value = "/etc/hosts"

    self._updater.send_notification(
        "test.txt",
        "hello@world.com",
        failed=True,
        notification_messages=self._converter.
            _TICKET_UPDATE_NOTIFICATION_MESSAGES,  # noqa
    )

    send_email_mock.assert_called_once_with(
        "hello@world.com",
        self._updater.ISSUETRACKER_SYNC_TITLE,
        settings.EMAIL_BULK_SYNC_EXCEPTION.render(
            sync_data={
                "title":
                    "There were some errors in updating ticket(s) for your "
                    "Bulk update action.",
                "email_text": self._updater.EXCEPTION_TEXT,
            }
        )
    )
