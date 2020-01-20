# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
from datetime import date
from datetime import datetime
from freezegun import freeze_time
from mock import patch

from ggrc.notifications import common
from ggrc.models import all_models
from ggrc_workflows.models import Cycle
from integration.ggrc import TestCase
from integration.ggrc.access_control import acl_helper
from integration.ggrc.api_helper import Api
from integration.ggrc.generator import ObjectGenerator
from integration.ggrc_workflows.generator import WorkflowsGenerator


class TestOneTimeWorkflowNotification(TestCase):

  """ This class contains simple one time workflow tests that are not
  in the gsheet test grid
  """

  def setUp(self):
    super(TestOneTimeWorkflowNotification, self).setUp()
    self.api = Api()
    self.wf_generator = WorkflowsGenerator()
    self.object_generator = ObjectGenerator()

    self.random_objects = self.object_generator.generate_random_objects()
    self.person_1 = self.create_user_with_role(role="Administrator")
    self.person_2 = self.create_user_with_role(role="Administrator")
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

  def test_one_time_wf_activate(self):
    """Test one time wf activation"""

    with freeze_time("2015-04-10"):
      _, wf = self.wf_generator.generate_workflow(self.one_time_workflow_1)
      _, cycle = self.wf_generator.generate_cycle(wf)
      self.wf_generator.activate_workflow(wf)

      person_1, person_2 = self.person_1, self.person_2
      secondary_assignee = self.secondary_assignee

    task_assignees = [person_1, person_2, secondary_assignee]
    with freeze_time("2015-04-11"):
      _, notif_data = common.get_daily_notifications()

      self.assertIn(person_2.email, notif_data)

      # cycle started notifs available only for contact
      self.assertIn("cycle_started", notif_data[person_2.email])
      self.assertIn(cycle.id, notif_data[person_2.email]["cycle_started"])

      for user in task_assignees:
        self.assertIn("my_tasks",
                      notif_data[user.email]["cycle_data"][cycle.id])

    with freeze_time("2015-05-03"):  # two days before due date
      _, notif_data = common.get_daily_notifications()
      for user in task_assignees:
        self.assertIn(user.email, notif_data)
        self.assertNotIn("due_in", notif_data[user.email])
        self.assertNotIn("due_today", notif_data[user.email])

    with freeze_time("2015-05-04"):  # one day before due date
      _, notif_data = common.get_daily_notifications()
      for user in task_assignees:
        self.assertEqual(len(notif_data[user.email]["due_in"]), 1)

    with freeze_time("2015-05-05"):  # due date
      _, notif_data = common.get_daily_notifications()
      for user in task_assignees:
        self.assertEqual(len(notif_data[user.email]["due_today"]), 1)

    with freeze_time("2015-05-10"):
      _, notif_data = common.get_daily_notifications()
      self.assertEqual(len(notif_data[secondary_assignee.email]["due_in"]), 2)

  @patch("ggrc.notifications.common.send_email")
  def test_one_time_wf_activate_single_person(self, mock_mail):
    """Test one time wf activation with single person"""

    with freeze_time("2015-04-10"):
      user = "user@example.com"
      _, wf = self.wf_generator.generate_workflow(
          self.one_time_workflow_single_person)

      _, cycle = self.wf_generator.generate_cycle(wf)
      self.wf_generator.activate_workflow(wf)

    with freeze_time("2015-04-11"):
      _, notif_data = common.get_daily_notifications()
      self.assertIn("cycle_started", notif_data[user])
      self.assertIn(cycle.id, notif_data[user]["cycle_started"])
      self.assertIn("my_tasks", notif_data[user]["cycle_data"][cycle.id])
      self.assertIn("cycle_tasks", notif_data[user]["cycle_data"][cycle.id])
      self.assertIn(
          "my_task_groups", notif_data[user]["cycle_data"][cycle.id])
      self.assertIn("cycle_url", notif_data[user]["cycle_started"][cycle.id])

      cycle = Cycle.query.get(cycle.id)
      cycle_data = notif_data[user]["cycle_data"][cycle.id]
      for task in cycle.cycle_task_group_object_tasks:
        self.assertIn(task.id, cycle_data["my_tasks"])
        self.assertIn(task.id, cycle_data["cycle_tasks"])
        self.assertIn("title", cycle_data["my_tasks"][task.id])
        self.assertIn("title", cycle_data["cycle_tasks"][task.id])
        self.assertIn("cycle_task_url", cycle_data["cycle_tasks"][task.id])

    with freeze_time("2015-05-03"):  # two days before due date
      _, notif_data = common.get_daily_notifications()
      self.assertIn(user, notif_data)
      self.assertNotIn("due_in", notif_data[user])
      self.assertNotIn("due_today", notif_data[user])

    with freeze_time("2015-05-04"):  # one day before due date
      _, notif_data = common.get_daily_notifications()
      self.assertEqual(len(notif_data[user]["due_in"]), 2)

    with freeze_time("2015-05-05"):  # due date
      _, notif_data = common.get_daily_notifications()
      self.assertEqual(len(notif_data[user]["due_today"]), 2)

      common.send_daily_digest_notifications()
      self.assertEqual(mock_mail.call_count, 1)

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

    secondary_task_assignee_id = all_models.AccessControlRole.query.filter(
        all_models.AccessControlRole.name == "Task Secondary Assignees",
        all_models.AccessControlRole.object_type == "TaskGroupTask",
    ).one().id
    self.one_time_workflow_1 = {
        "title": "one time test workflow",
        "description": "some test workflow",
        "notify_on_change": True,
        # admin will be current user with id == 1
        "task_groups": [{
            "title": "one time task group",
            "contact": person_dict(self.person_2.id),
            "task_group_tasks": [{
                "title": "task 1",
                "description": "some task",
                "access_control_list": [
                    acl_helper.get_acl_json(task_assignee_role_id,
                                            self.person_1.id),
                    acl_helper.get_acl_json(secondary_task_assignee_id,
                                            self.secondary_assignee.id),
                ],
                "start_date": date(2015, 5, 1),  # friday
                "end_date": date(2015, 5, 5),
            }, {
                "title": "task 2",
                "description": "some task",
                "access_control_list": [
                    acl_helper.get_acl_json(task_assignee_role_id,
                                            self.person_1.id),
                    acl_helper.get_acl_json(secondary_task_assignee_id,
                                            self.secondary_assignee.id),
                ],
                "start_date": date(2015, 5, 4),
                "end_date": date(2015, 5, 7),
            }],
            "task_group_objects": self.random_objects[:2]
        }, {
            "title": "another one time task group",
            "contact": person_dict(self.person_2.id),
            "task_group_tasks": [{
                "title": "task 1 in tg 2",
                "description": "some task",
                "access_control_list": [
                    acl_helper.get_acl_json(task_assignee_role_id,
                                            self.person_1.id)
                ],
                "start_date": date(2015, 5, 8),  # friday
                "end_date": date(2015, 5, 12),
            }, {
                "title": "task 2 in tg 2",
                "description": "some task",
                "access_control_list": [
                    acl_helper.get_acl_json(task_assignee_role_id,
                                            self.person_2.id)
                ],
                "start_date": date(2015, 5, 1),  # friday
                "end_date": date(2015, 5, 5),
            }],
            "task_group_objects": []
        }]
    }

    user = all_models.Person.query.filter(
        all_models.Person.email == "user@example.com"
    ).one().id

    self.one_time_workflow_single_person = {
        "title": "one time test workflow",
        "notify_on_change": True,
        "description": "some test workflow",
        # admin will be current user with id == 1
        "task_groups": [{
            "title": "one time task group",
            "contact": person_dict(user),
            "task_group_tasks": [{
                "title": u"task 1 \u2062 WITH AN UMBRELLA ELLA ELLA. \u2062",
                "description": "some task. ",
                "access_control_list": [
                    acl_helper.get_acl_json(task_assignee_role_id, user)
                ],
                "start_date": date(2015, 5, 1),  # friday
                "end_date": date(2015, 5, 5),
            }, {
                "title": "task 2",
                "description": "some task",
                "access_control_list": [
                    acl_helper.get_acl_json(task_assignee_role_id, user)
                ],
                "start_date": date(2015, 5, 4),
                "end_date": date(2015, 5, 7),
            }],
            "task_group_objects": self.random_objects[:2]
        }, {
            "title": "another one time task group",
            "contact": person_dict(user),
            "task_group_tasks": [{
                "title": u"task 1 \u2062 WITH AN UMBRELLA ELLA ELLA. \u2062",
                "description": "some task",
                "access_control_list": [
                    acl_helper.get_acl_json(task_assignee_role_id, user)
                ],
                "start_date": date(2015, 5, 8),  # friday
                "end_date": date(2015, 5, 12),
            }, {
                "title": "task 2 in tg 2",
                "description": "some task",
                "access_control_list": [
                    acl_helper.get_acl_json(task_assignee_role_id, user)
                ],
                "start_date": date(2015, 5, 1),  # friday
                "end_date": date(2015, 5, 5),
            }],
            "task_group_objects": []
        }]
    }
