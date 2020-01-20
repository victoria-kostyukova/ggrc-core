# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test for moving notificatoins into history table functionality."""

from datetime import date

from freezegun import freeze_time
from mock import patch
from sqlalchemy import and_
from sqlalchemy import false

from ggrc.app import db
from ggrc.models import Notification
from ggrc.models import NotificationHistory
from ggrc.models import all_models
from ggrc.notifications import common
from integration.ggrc import TestCase
from integration.ggrc.access_control import acl_helper
from integration.ggrc.generator import ObjectGenerator
from integration.ggrc_workflows.generator import WorkflowsGenerator


class TestNotificationsHistory(TestCase):
  """Tests notifications history cron job."""
  def setUp(self):
    """Set up."""
    super(TestNotificationsHistory, self).setUp()
    self.wf_generator = WorkflowsGenerator()
    self.object_generator = ObjectGenerator()
    _, self.user = self.object_generator.generate_person(
        user_role="Administrator")

    self._create_test_cases()

  @patch("ggrc.notifications.common.send_email")
  def test_move_notif_to_history(self, mocked_send_email):
    """Tests moving notifications to history table."""
    # pylint: disable=unused-argument
    # pylint: disable=unused-variable
    date_time = "2018-06-10 16:55:15"
    with freeze_time(date_time):
      _, workflow = self.wf_generator.generate_workflow(
          self.one_time_workflow)

      _, cycle = self.wf_generator.generate_cycle(workflow)
      self.wf_generator.activate_workflow(workflow)

      notif_to_be_sent_ids = db.session.query(Notification.id).filter(and_(
          Notification.sent_at == None,  # noqa
          Notification.send_on == date.today(),
          Notification.repeating == false()
      )).all()

      self.assertEqual(db.session.query(Notification).count(), 5)
      self.assertEqual(db.session.query(NotificationHistory).count(), 0)

      with freeze_time(date_time):
        common.send_daily_digest_notifications()

      notif_count = db.session.query(Notification).filter(
          Notification.id.in_(notif_to_be_sent_ids)
      ).count()

      notif_history_count = db.session.query(NotificationHistory).count()

      self.assertEqual(notif_count, 0)
      self.assertEqual(notif_history_count, len(notif_to_be_sent_ids))

  def _create_test_cases(self):
    """Create configuration to use for generating a new workflow."""
    role_id = all_models.AccessControlRole.query.filter(
        all_models.AccessControlRole.name == "Task Assignees",
        all_models.AccessControlRole.object_type == "TaskGroupTask",
    ).one().id
    self.one_time_workflow = {
        "title": "one time test workflow",
        "notify_on_change": True,
        "description": "some test workflow",
        "task_groups": [{
            "title": "one time task group",
            "contact": {
                "href": "/api/people/" + str(self.user.id),
                "id": self.user.id,
                "type": "Person"
            },
            "task_group_tasks": [{
                "title": "task 1",
                "description": "some task",
                "start_date": date(2018, 6, 10),
                "end_date": date(2018, 7, 10),
                "access_control_list": [
                    acl_helper.get_acl_json(role_id, self.user.id)],
            }]
        }]
    }
