# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

from datetime import date
from datetime import datetime
from freezegun import freeze_time
from mock import patch

from ggrc.models import all_models
from ggrc.notifications import common
from ggrc_workflows.models import Cycle, CycleTaskGroupObjectTask
from integration.ggrc import TestCase
from integration.ggrc.access_control import acl_helper
from integration.ggrc.api_helper import Api
from integration.ggrc.generator import ObjectGenerator
from integration.ggrc_workflows.generator import WorkflowsGenerator


class TestOneTimeWfEndDateChange(TestCase):

  """ This class contains simple one time workflow tests that are not
  in the gsheet test grid
  """

  def setUp(self):
    super(TestOneTimeWfEndDateChange, self).setUp()
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

  @patch("ggrc.notifications.common.send_email")
  def test_no_date_change(self, mock_mail):
    """Test a basic case with no moving end date"""
    with freeze_time("2015-04-10 03:21:34"):
      _, workflow = self.wf_generator.generate_workflow(
          self.one_time_workflow_1)

      _, cycle = self.wf_generator.generate_cycle(workflow)
      self.wf_generator.activate_workflow(workflow)

    assignee = self.user
    task_assignees = [assignee, self.secondary_assignee]
    with freeze_time("2015-04-11 03:21:34"):
      _, notif_data = common.get_daily_notifications()

      # cycle started notifs available only for contact
      self.assertIn("cycle_started", notif_data[assignee.email])

    with freeze_time("2015-05-02 03:21:34"):
      _, notif_data = common.get_daily_notifications()
      self.assertIn(assignee.email, notif_data)

      # cycle started notifs available only for contact
      self.assertIn("cycle_started", notif_data[assignee.email])
      for user in task_assignees:
        self.assertNotIn("due_in", notif_data[user.email])
        self.assertNotIn("due_today", notif_data[user.email])

    with freeze_time("2015-05-02 03:21:34"):
      common.send_daily_digest_notifications()
      _, notif_data = common.get_daily_notifications()
      self.assertEqual(notif_data, {})

      # one email to admin, one to assigne and one to secondary assignee
      self.assertEqual(mock_mail.call_count, 3)

    with freeze_time("2015-05-04 03:21:34"):  # one day before due date
      _, notif_data = common.get_daily_notifications()
      for user in task_assignees:
        self.assertIn(user.email, notif_data)
        self.assertIn("due_in", notif_data[user.email])
        self.assertEqual(len(notif_data[user.email]["due_in"]), 2)

    with freeze_time("2015-05-04 03:21:34"):  # one day before due date
      common.send_daily_digest_notifications()
      _, notif_data = common.get_daily_notifications()
      self.assertEqual(notif_data, {})

      # one email to admin and two each to assigne and secondary assignee
      self.assertEqual(mock_mail.call_count, 5)

    with freeze_time("2015-05-05 03:21:34"):  # due date
      _, notif_data = common.get_daily_notifications()
      for user in task_assignees:
        self.assertIn("due_today", notif_data[user.email])
        self.assertEqual(len(notif_data[user.email]["due_today"]), 2)

  @patch("ggrc.notifications.common.send_email")
  def test_move_end_date_to_future(self, mock_mail):
    """Test moving the end date to the future.

    It is done before due_in and due_today notifications have been sent.
    """
    with freeze_time("2015-04-10 03:21:34"):
      _, workflow = self.wf_generator.generate_workflow(
          self.one_time_workflow_1)

      _, cycle = self.wf_generator.generate_cycle(workflow)
      self.wf_generator.activate_workflow(workflow)

    assignee = self.user
    task_assignees = [assignee, self.secondary_assignee]
    with freeze_time("2015-04-11 03:21:34"):
      _, notif_data = common.get_daily_notifications()
      # cycle started notifs available only for contact
      self.assertIn("cycle_started", notif_data[assignee.email])

    with freeze_time("2015-05-02 03:21:34"):
      _, notif_data = common.get_daily_notifications()
      for user in task_assignees:
        self.assertIn(user.email, notif_data)
        self.assertNotIn("due_in", notif_data[user.email])
        self.assertNotIn("due_today", notif_data[user.email])
      # cycle started notifs available only for contact
      self.assertIn("cycle_started", notif_data[assignee.email])

    with freeze_time("2015-05-02 03:21:34"):
      common.send_daily_digest_notifications()
      _, notif_data = common.get_daily_notifications()
      self.assertEqual(notif_data, {})

      # one email to admin and one each to assigne and secondary assignee
      self.assertEqual(mock_mail.call_count, 3)

    with freeze_time("2015-05-03 03:21:34"):
      cycle = Cycle.query.get(cycle.id)
      task1 = CycleTaskGroupObjectTask.query.get(
          cycle.cycle_task_group_object_tasks[0].id)
      task2 = CycleTaskGroupObjectTask.query.get(
          cycle.cycle_task_group_object_tasks[1].id)

      self.wf_generator.modify_object(
          task1, data={"end_date": date(2015, 5, 15)})
      self.wf_generator.modify_object(
          task2, data={"end_date": date(2015, 5, 15)})

    with freeze_time("2015-05-04 03:21:34"):  # one day before due date
      _, notif_data = common.get_daily_notifications()
      self.assertEqual(notif_data, {})

    with freeze_time("2015-05-05 03:21:34"):  # due date
      _, notif_data = common.get_daily_notifications()
      self.assertEqual(notif_data, {})

    with freeze_time("2015-05-14 03:21:34"):  # due date
      _, notif_data = common.get_daily_notifications()
      for user in task_assignees:
        self.assertIn(user.email, notif_data)
        self.assertIn("due_in", notif_data[user.email])
        self.assertEqual(len(notif_data[user.email]["due_in"]),
                         len(self.random_objects))

    with freeze_time("2015-05-15 03:21:34"):  # due date
      _, notif_data = common.get_daily_notifications()
      for user in task_assignees:
        self.assertIn(user.email, notif_data)

        self.assertIn("due_in", notif_data[user.email])

        self.assertIn("due_today", notif_data[user.email])
        self.assertEqual(len(notif_data[user.email]["due_today"]),
                         len(self.random_objects))

  @patch("ggrc.notifications.common.send_email")
  def test_move_end_date_to_past(self, mock_mail):
    """Test moving an end date to the past"""
    with freeze_time("2015-04-10 03:21:34"):
      _, workflow = self.wf_generator.generate_workflow(
          self.one_time_workflow_1)

      _, cycle = self.wf_generator.generate_cycle(workflow)
      self.wf_generator.activate_workflow(workflow)

    with freeze_time("2015-05-02 03:21:34"):
      common.send_daily_digest_notifications()
      _, notif_data = common.get_daily_notifications()
      self.assertEqual(notif_data, {})

      # one email to admin and one to assignee
      self.assertEqual(mock_mail.call_count, 3)

    with freeze_time("2015-05-03 03:21:34"):
      cycle = Cycle.query.get(cycle.id)
      task1 = CycleTaskGroupObjectTask.query.get(
          cycle.cycle_task_group_object_tasks[0].id)
      task2 = CycleTaskGroupObjectTask.query.get(
          cycle.cycle_task_group_object_tasks[1].id)

      self.wf_generator.modify_object(
          task1, data={"end_date": date(2015, 5, 1)})
      self.wf_generator.modify_object(
          task2, data={"end_date": date(2015, 5, 1)})

    task_assignees = [self.user, self.secondary_assignee]
    with freeze_time("2015-05-03 03:21:34"):  # two days after due date
      _, notif_data = common.get_daily_notifications()
      self.assertNotEqual(notif_data, {})
      for user in task_assignees:
        self.assertIn(user.email, notif_data)

        user_notifs = notif_data[user.email]
        self.assertNotIn("due_today", user_notifs)
        self.assertNotIn("due_in", user_notifs)

        self.assertIn("task_overdue", user_notifs)
        self.assertEqual(len(user_notifs["task_overdue"]), 2)

  @patch("ggrc.notifications.common.send_email")
  def test_move_end_date_to_today(self, mock_mail):
    """Test moving end date to today"""
    with freeze_time("2015-04-10 03:21:34"):
      _, workflow = self.wf_generator.generate_workflow(
          self.one_time_workflow_1)

      _, cycle = self.wf_generator.generate_cycle(workflow)
      self.wf_generator.activate_workflow(workflow)

    task_assignees = [self.user, self.secondary_assignee]
    with freeze_time("2015-05-02 03:21:34"):
      common.send_daily_digest_notifications()
      _, notif_data = common.get_daily_notifications()
      self.assertEqual(notif_data, {})

      # one email to admin and one to assigne
      self.assertEqual(mock_mail.call_count, 3)

    with freeze_time("2015-05-03 03:21:34"):
      cycle = Cycle.query.get(cycle.id)
      task1 = CycleTaskGroupObjectTask.query.get(
          cycle.cycle_task_group_object_tasks[0].id)
      task2 = CycleTaskGroupObjectTask.query.get(
          cycle.cycle_task_group_object_tasks[1].id)

      self.wf_generator.modify_object(
          task1, data={"end_date": date(2015, 5, 3)})
      self.wf_generator.modify_object(
          task2, data={"end_date": date(2015, 5, 4)})

    with freeze_time("2015-05-03 03:21:34"):  # one day before due date
      _, notif_data = common.get_daily_notifications()
      for user in task_assignees:
        self.assertNotEqual(notif_data, {})
        self.assertIn(user.email, notif_data)
        self.assertIn("due_today", notif_data[user.email])
        self.assertIn("due_in", notif_data[user.email])
        self.assertEqual(len(notif_data[user.email]["due_today"]), 1)

      common.send_daily_digest_notifications()

    with freeze_time("2015-05-04 03:21:34"):  # due date (of task2)
      _, notif_data = common.get_daily_notifications()
      for user in task_assignees:
        self.assertIn(user.email, notif_data)
        self.assertIn("due_today", notif_data[user.email])
        self.assertNotIn("due_in", notif_data[user.email])
      common.send_daily_digest_notifications()

    # check that overdue notifications are sent even on days after the day a
    # task has become due, unlike the "due_today" and "due_in" notifications
    with freeze_time("2015-05-05 03:21:34"):  # 1+ days after due date(s)
      _, notif_data = common.get_daily_notifications()
      self.assertNotEqual(notif_data, {})
      for user in task_assignees:
        self.assertIn(user.email, notif_data)

        user_notifs = notif_data[user.email]
        self.assertNotIn("due_today", user_notifs)
        self.assertNotIn("due_in", user_notifs)

        self.assertIn("task_overdue", user_notifs)
        self.assertEqual(len(user_notifs["task_overdue"]), 2)

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
        # admin will be current user with id == 1
        "task_groups": [{
            "title": "one time task group",
            "contact": person_dict(self.user.id),
            "task_group_tasks": [{
                "title": "task 1",
                "description": "some task",
                "start_date": date(2015, 5, 1),  # friday
                "end_date": date(2015, 5, 5),
                "access_control_list": [
                    acl_helper.get_acl_json(task_assignee_role_id,
                                            self.user.id),
                    acl_helper.get_acl_json(task_secondary_assignee,
                                            self.secondary_assignee.id),
                ],
            }, {
                "title": "task 2",
                "description": "some task 2",
                "start_date": date(2015, 5, 1),  # friday
                "end_date": date(2015, 5, 5),
                "access_control_list": [
                    acl_helper.get_acl_json(task_assignee_role_id,
                                            self.user.id),
                    acl_helper.get_acl_json(task_secondary_assignee,
                                            self.secondary_assignee.id),
                ],
            }],
            "task_group_objects": self.random_objects
        }]
    }
