# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

from datetime import date
from datetime import datetime

from freezegun import freeze_time
from mock import patch
from sqlalchemy import and_

from ggrc.models import all_models
from ggrc.notifications import common
from ggrc.notifications.common import generate_cycle_tasks_notifs
from ggrc_workflows.models import Cycle
from ggrc_workflows.models import CycleTaskGroupObjectTask
from integration.ggrc import TestCase
from integration.ggrc.access_control import acl_helper

from integration.ggrc.api_helper import Api
from integration.ggrc.generator import ObjectGenerator
from integration.ggrc_workflows.generator import WorkflowsGenerator


class TestCycleTaskStatusChange(TestCase):

  """ This class contains simple one time workflow tests that are not
  in the gsheet test grid
  """

  def setUp(self):
    super(TestCycleTaskStatusChange, self).setUp()
    self.api = Api()
    self.wf_generator = WorkflowsGenerator()
    self.object_generator = ObjectGenerator()
    all_models.Notification.query.delete()
    self.random_objects = self.object_generator.generate_random_objects(2)
    self.user = self.create_user_with_role(role="Administrator")
    self.secondary_assignee = self.create_user_with_role(role="Reader")
    self.create_test_cases()

    def init_decorator(init):
      def new_init(self, *args, **kwargs):
        init(self, *args, **kwargs)
        if hasattr(self, "created_at"):
          self.created_at = datetime.now()
      return new_init

    all_models.Notification.__init__ = init_decorator(
        all_models.Notification.__init__)

  def test_task_declined_notification_created(self):
    """Test declined cycle task notifications"""
    with freeze_time("2015-05-01"):
      _, workflow = self.wf_generator.generate_workflow(
          self.one_time_workflow_1)

      _, cycle = self.wf_generator.generate_cycle(workflow)
      self.wf_generator.activate_workflow(workflow)

      cycle = Cycle.query.get(cycle.id)
      task1 = CycleTaskGroupObjectTask.query.get(
          cycle.cycle_task_group_object_tasks[0].id)

      self.task_change_status(task1, "Declined")

      notif = self.get_notifications_by_type(task1, "cycle_task_declined")
      self.assertEqual(len(notif), 1, "notifications: {}".format(str(notif)))

  def test_all_tasks_finished_notification_created(self):
    """Test all task completed notifications"""
    with freeze_time("2015-05-01 13:20:34"):
      _, workflow = self.wf_generator.generate_workflow(
          self.one_time_workflow_1)

      _, cycle = self.wf_generator.generate_cycle(workflow)
      self.wf_generator.activate_workflow(workflow)

      cycle = Cycle.query.get(cycle.id)
      task1 = CycleTaskGroupObjectTask.query.get(
          cycle.cycle_task_group_object_tasks[0].id)

      self.task_change_status(task1)

      generate_cycle_tasks_notifs()

      notif = self.get_notifications_by_type(cycle,
                                             "all_cycle_tasks_completed")
      self.assertEqual(len(notif), 1, "notifications: {}".format(str(notif)))

      notif = self.get_notifications_by_type(task1,
                                             "all_cycle_tasks_completed")
      self.assertEqual(notif, [])

  def test_multi_all_tasks_finished_notification_created(self):
    """Test several all task completed notifications"""

    with freeze_time("2015-05-01 13:20:34"):
      _, workflow = self.wf_generator.generate_workflow(
          self.one_time_workflow_2)

      _, cycle = self.wf_generator.generate_cycle(workflow)
      self.wf_generator.activate_workflow(workflow)

      cycle = Cycle.query.get(cycle.id)
      task1 = CycleTaskGroupObjectTask.query.get(
          cycle.cycle_task_group_object_tasks[0].id)

      self.task_change_status(task1)

      generate_cycle_tasks_notifs()
      notif = self.get_notifications_by_type(cycle,
                                             "all_cycle_tasks_completed")

      # there is still one task in the cycle, so there should be no
      # notifications for all tasks completed
      self.assertEqual(notif, [])

      notif = self.get_notifications_by_type(task1,
                                             "all_cycle_tasks_completed")

      # The task was verified, so there should be no notifications left for due
      # dates.
      self.assertEqual(notif, [])

      task2 = CycleTaskGroupObjectTask.query.get(
          cycle.cycle_task_group_object_tasks[1].id)

      self.task_change_status(task2)

      generate_cycle_tasks_notifs()
      notif = self.get_notifications_by_type(cycle,
                                             "all_cycle_tasks_completed")

      self.assertEqual(len(notif), 1, "notifications: {}".format(str(notif)))

  @patch("ggrc.notifications.common.send_email")
  def test_single_task_declined(self, mock_mail):
    """Test moving the end date to the future on declined task.

    It is done before due_in and due_today notifications have been sent.
    """

    with freeze_time("2015-05-01"):
      _, workflow = self.wf_generator.generate_workflow(
          self.one_time_workflow_1)

      _, cycle = self.wf_generator.generate_cycle(workflow)
      self.wf_generator.activate_workflow(workflow)

    with freeze_time("2015-05-02"):
      common.send_daily_digest_notifications()

      cycle = Cycle.query.get(cycle.id)
      task1 = CycleTaskGroupObjectTask.query.get(
          cycle.cycle_task_group_object_tasks[0].id)

      self.task_change_status(task1, "Finished")

      _, notif_data = common.get_daily_notifications()
      self.assertEqual(notif_data, {})

    task_assignees = [self.user, self.secondary_assignee]
    with freeze_time("2015-05-02"):
      common.send_daily_digest_notifications()

      cycle = Cycle.query.get(cycle.id)
      task1 = CycleTaskGroupObjectTask.query.get(
          cycle.cycle_task_group_object_tasks[0].id)

      self.task_change_status(task1, "Declined")

      _, notif_data = common.get_daily_notifications()
      for user in task_assignees:
        self.assertIn(user.email, notif_data)
        self.assertIn("task_declined", notif_data[user.email])

  @patch("ggrc.notifications.common.send_email")
  def test_single_task_accepted(self, mock_mail):
    """Test moving the end date to the future on accepted task.

    It is done before due_in and due_today notifications have been sent.
    """

    with freeze_time("2015-05-01"):
      _, workflow = self.wf_generator.generate_workflow(
          self.one_time_workflow_1)

      _, cycle = self.wf_generator.generate_cycle(workflow)
      self.wf_generator.activate_workflow(workflow)

    with freeze_time("2015-05-02"):
      common.send_daily_digest_notifications()

      cycle = Cycle.query.get(cycle.id)
      task1 = CycleTaskGroupObjectTask.query.get(
          cycle.cycle_task_group_object_tasks[0].id)

      self.task_change_status(task1, "Finished")

      _, notif_data = common.get_daily_notifications()
      self.assertEqual(notif_data, {})

    task_assignees = [self.user, self.secondary_assignee]
    with freeze_time("2015-05-03 13:20:34"):
      cycle = Cycle.query.get(cycle.id)
      task1 = CycleTaskGroupObjectTask.query.get(
          cycle.cycle_task_group_object_tasks[0].id)

      self.task_change_status(task1)

      generate_cycle_tasks_notifs()
      _, notif_data = common.get_daily_notifications()
      for user in task_assignees:
        self.assertNotIn(user.email, notif_data)
      self.assertIn("all_tasks_completed", notif_data["user@example.com"])

  @patch("ggrc.notifications.common.send_email")
  def test_end_cycle(self, mock_mail):
    """Manually ending cycle should stop all notifications for that cycle."""

    with freeze_time("2015-05-01"):
      _, workflow = self.wf_generator.generate_workflow(
          self.one_time_workflow_1)
      _, cycle = self.wf_generator.generate_cycle(workflow)
      self.wf_generator.activate_workflow(workflow)

    task_assignees = [self.user, self.secondary_assignee]
    with freeze_time("2015-05-03"):
      _, notif_data = common.get_daily_notifications()
      cycle = Cycle.query.get(cycle.id)
      for user in task_assignees:
        self.assertIn(user.email, notif_data)
      self.wf_generator.modify_object(cycle, data={"is_current": False})
      cycle = Cycle.query.get(cycle.id)
      self.assertFalse(cycle.is_current)

      _, notif_data = common.get_daily_notifications()
      for user in task_assignees:
        self.assertNotIn(user.email, notif_data)

  def create_test_cases(self):
    def person_dict(person_id):
      return {
          "href": "/api/people/%d" % person_id,
          "id": person_id,
          "type": "Person"
      }

    task_assignee_role_id = all_models.AccessControlRole.query.filter(
        all_models.AccessControlRole.name == "Task Assignees",
        all_models.AccessControlRole.object_type == "TaskGroupTask",
    ).one().id

    task_secondary_assignee = all_models.AccessControlRole.query.filter(
        all_models.AccessControlRole.name == "Task Secondary Assignees",
        all_models.AccessControlRole.object_type == "TaskGroupTask",
    ).one().id

    self.one_time_workflow_1 = {
        "title": "one time test workflow",
        "notify_on_change": True,
        "description": "some test workflow",
        "is_verification_needed": True,
        # admin will be current user with id == 1
        "task_groups": [{
            "title": "single task group",
            "contact": person_dict(self.user.id),
            "task_group_tasks": [{
                "title": "task 1",
                "description": "single task in a wf",
                "access_control_list": [
                    acl_helper.get_acl_json(task_assignee_role_id,
                                            self.user.id),
                    acl_helper.get_acl_json(task_secondary_assignee,
                                            self.secondary_assignee.id),
                ],
                "start_date": date(2015, 5, 1),  # friday
                "end_date": date(2015, 5, 5),
            }],
        }]
    }

    self.one_time_workflow_2 = {
        "title": "one time test workflow",
        "notify_on_change": True,
        "description": "some test workflow",
        "is_verification_needed": True,
        # admin will be current user with id == 1
        "task_groups": [{
            "title": "one time task group",
            "contact": person_dict(self.user.id),
            "task_group_tasks": [{
                "title": "task 1",
                "description": "two taks in wf with different objects",
                "access_control_list": [
                    acl_helper.get_acl_json(task_assignee_role_id,
                                            self.user.id)],
                "start_date": date(2015, 5, 1),  # friday
                "end_date": date(2015, 5, 5),
            }, {
                "title": "task 2",
                "description": "two taks in wf with different objects",
                "access_control_list": [
                    acl_helper.get_acl_json(task_assignee_role_id,
                                            self.user.id)],
                "start_date": date(2015, 5, 1),  # friday
                "end_date": date(2015, 5, 5),
            }],
            "task_group_objects": self.random_objects
        }]
    }

  def get_notification_type(self, name):
    return all_models.NotificationType.query.filter(
        all_models.NotificationType.name == name).one()

  def task_change_status(self, task, status="Verified"):
    self.wf_generator.modify_object(
        task, data={"status": status})

    task = CycleTaskGroupObjectTask.query.get(task.id)

    self.assertEqual(task.status, status)

  def get_notifications_by_type(self, obj, notif_type):
    return all_models.Notification.query.filter(and_(
      all_models.Notification.object_id == obj.id,
      all_models.Notification.object_type == obj.type,
      all_models.Notification.sent_at == None,  # noqa
      all_models.Notification.notification_type == self.get_notification_type(
          notif_type
      )
    )).all()
