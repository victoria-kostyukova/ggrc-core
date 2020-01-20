# -*- coding: utf-8 -*-

# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Integration tests for sending the notifications about WF tasks "due soon".
"""

from datetime import date, datetime, timedelta
from freezegun import freeze_time
from mock import patch
import ddt

import sqlalchemy as sa
from ggrc.models import all_models
from ggrc.notifications import common

from integration.ggrc_workflows.generator import WorkflowsGenerator
from integration.ggrc.access_control import acl_helper
from integration.ggrc.api_helper import Api
from integration.ggrc.generator import ObjectGenerator
from integration.ggrc.notifications import TestNotifications


@ddt.ddt
class TestTaskDueNotifications(TestNotifications):
  """Test suite for task due soon/today notifications."""

  def setUp(self):
    super(TestTaskDueNotifications, self).setUp()
    self.api = Api()
    self.wf_generator = WorkflowsGenerator()
    self.object_generator = ObjectGenerator()
    all_models.Notification.query.delete()

    self._fix_notification_init()

    self.random_objects = self.object_generator.generate_random_objects(2)
    self.user = self.create_user_with_role(role="Administrator")
    self.secondary_assignee = self.create_user_with_role(role="Reader")

    task_assignee_role_id = all_models.AccessControlRole.query.filter(
        all_models.AccessControlRole.name == "Task Assignees",
        all_models.AccessControlRole.object_type == "TaskGroupTask",
    ).one().id

    task_secondary_assignee = all_models.AccessControlRole.query.filter(
        all_models.AccessControlRole.name == "Task Secondary Assignees",
        all_models.AccessControlRole.object_type == "TaskGroupTask",
    ).one().id

    self.one_time_workflow = {
        "title": "one time test workflow",
        "notify_on_change": True,
        "description": "some test workflow",
        "is_verification_needed": False,
        # admin will be current user with id == 1
        "task_groups": [{
            "title": "one time task group",
            "contact": {
                "href": "/api/people/{}".format(self.user.id),
                "id": self.user.id,
                "type": "Person",
            },
            "task_group_tasks": [{
                "title": "task 1",
                "description": "some task",
                "access_control_list": [
                    acl_helper.get_acl_json(task_assignee_role_id,
                                            self.user.id),
                    acl_helper.get_acl_json(task_secondary_assignee,
                                            self.secondary_assignee.id),
                ],
                "start_date": date(2017, 5, 15),
                "end_date": date(2017, 6, 11),
            }, {
                "title": "task 2",
                "description": "some task 2",
                "access_control_list": [
                    acl_helper.get_acl_json(task_assignee_role_id,
                                            self.user.id),
                    acl_helper.get_acl_json(task_secondary_assignee,
                                            self.secondary_assignee.id),
                ],
                "start_date": date(2017, 5, 8),
                "end_date": date(2017, 6, 12),
            }, {
                "title": "task 3",
                "description": "some task 3",
                "access_control_list": [
                    acl_helper.get_acl_json(task_assignee_role_id,
                                            self.user.id),
                    acl_helper.get_acl_json(task_secondary_assignee,
                                            self.secondary_assignee.id),
                ],
                "start_date": date(2017, 5, 31),
                "end_date": date(2017, 6, 13),
            }, {
                "title": "task 4",
                "description": "some task 4",
                "access_control_list": [
                    acl_helper.get_acl_json(task_assignee_role_id,
                                            self.user.id),
                    acl_helper.get_acl_json(task_secondary_assignee,
                                            self.secondary_assignee.id),
                ],
                "start_date": date(2017, 6, 2),
                "end_date": date(2017, 6, 14),
            }, {
                "title": "task 5",
                "description": "some task 5",
                "access_control_list": [
                    acl_helper.get_acl_json(task_assignee_role_id,
                                            self.user.id),
                    acl_helper.get_acl_json(task_secondary_assignee,
                                            self.secondary_assignee.id),
                ],
                "start_date": date(2017, 6, 8),
                "end_date": date(2017, 6, 15),
            }],
            "task_group_objects": self.random_objects
        }]
    }

  @ddt.unpack
  @ddt.data(
      ("2017-06-12 12:12:12", ["task 1"], ["task 2"], ["task 3"]),
      ("2017-06-13 13:13:13", ["task 1", "task 2"], ["task 3"], ["task 4"]),
  )
  @patch("ggrc.notifications.common.send_email")
  def test_creating_obsolete_notifications(
      self, fake_now, expected_overdue, expected_due_today, expected_due_in, _
  ):
    """Notifications already obsolete on creation date should not be created.
    """
    # pylint: disable=invalid-name
    with freeze_time("2017-06-12 09:39:32"):
      tmp = self.one_time_workflow.copy()
      _, workflow = self.wf_generator.generate_workflow(tmp)
      self.wf_generator.generate_cycle(workflow)
      response, workflow = self.wf_generator.activate_workflow(workflow)
      self.assert200(response)

    task_assignees = [self.user, self.secondary_assignee]
    with freeze_time(fake_now):
      # mark all yeasterday notifications as sent
      all_models.Notification.query.filter(
          sa.func.DATE(all_models.Notification.send_on) < date.today()
      ).update({all_models.Notification.sent_at:
                datetime.now() - timedelta(1)},
               synchronize_session="fetch")

      _, notif_data = common.get_daily_notifications()
      for user in task_assignees:
        user_notifs = notif_data.get(user.email, {})

        actual_overdue = [n['title'] for n in
                          user_notifs.get("task_overdue", {}).itervalues()]
        actual_overdue.sort()
        self.assertEqual(actual_overdue, expected_overdue)

        self.assertEqual(
            [n['title'] for n in
             user_notifs.get("due_today", {}).itervalues()],
            expected_due_today)

        self.assertEqual(
            [n['title'] for n in user_notifs.get("due_in", {}).itervalues()],
            expected_due_in)
