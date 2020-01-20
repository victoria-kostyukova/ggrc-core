# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>


"""Tests ordering for /query api."""

import ddt

import sqlalchemy as sa

from ggrc import db
from ggrc.models import all_models

from integration.ggrc import TestCase
from integration.ggrc.models import factories
from integration.ggrc.query_helper import WithQueryApi
from integration.ggrc_workflows.models import factories as wf_factories


@ddt.ddt
class TestOrder(TestCase, WithQueryApi):
  """Tests people ordering"""

  def setUp(self):
    super(TestOrder, self).setUp()
    self.client.get("/login")
    self.users = []
    test_user_names = ["Turing",
                       "Alan",
                       "Smurfette",
                       "Terminator",
                       "Rosy",
                       "Lilly"]
    for username in test_user_names:
      self.users.append(factories.PersonFactory(
          name=username, email="{}@example.com".format(username.lower())))

  def _check_ordering(self, object_name, sorted_titles, order_by):
    """Check query set ordering"""
    objects = self.simple_query(object_name,
                                order_by=[{"name": order_by, "desc": False}])
    titles = [obj['title'] for obj in objects]
    self.assertEqual(titles, sorted_titles)
    objects = self.simple_query(object_name,
                                order_by=[{"name": order_by, "desc": True}])
    titles = [obj['title'] for obj in objects]
    self.assertEqual(titles, list(reversed(sorted_titles)))

  @ddt.data("Assignees", "Creators", "Verifiers")
  def test_assessment_roles(self, role):
    """Assessment assignees/verifiers/creators ordering"""
    with factories.single_commit():

      for i, user in enumerate(self.users):
        assessment = factories.AssessmentFactory(
            title="assessment{}".format(i + 1))
        assessment.add_person_with_role_name(user, role)

    query = db.session.query(all_models.Assessment.title).join(
        all_models.AccessControlList,
        sa.and_(
            all_models.AccessControlList.object_type == "Assessment",
            all_models.AccessControlList.object_id == all_models.Assessment.id,
        )
    ).join(
        all_models.AccessControlRole,
    ).join(
        all_models.AccessControlPerson
    ).join(
        all_models.Person,
    ).filter(all_models.AccessControlRole.name == role).order_by(
        all_models.Person.email,
    )

    sorted_titles = [a[0] for a in query]
    self._check_ordering("Assessment", sorted_titles, role)

  @ddt.data("Admin",
            "Primary Contacts",
            "Secondary Contacts")
  def test_risk_roles(self, role):
    """Risk roles ordering"""
    sorted_titles = [
        title for title, in
        db.session.query(all_models.Risk.title).filter(
            all_models.AccessControlList.object_type == "Risk",
            all_models.AccessControlList.object_id == all_models.Risk.id,
            (all_models.AccessControlList.ac_role_id ==
             all_models.AccessControlRole.id),
            all_models.AccessControlRole.name == role,
            (all_models.AccessControlPerson.ac_list_id ==
             all_models.AccessControlList.id),
            all_models.Person.id == all_models.AccessControlPerson.person_id)
        .order_by(all_models.Person.email)]
    self._check_ordering("Risk", sorted_titles, role)

  def test_task_group_assignee(self):
    """Task Group assignee ordering"""
    with factories.single_commit():
      for user in self.users:
        task_group = wf_factories.TaskGroupFactory(contact_id=user.id)
        task_group.add_person_with_role_name(user, "Task Assignee")

    sorted_titles = [
        title for title, in
        db.session.query(all_models.TaskGroup.title).filter(
            all_models.Person.id == all_models.TaskGroup.contact_id,
        ).order_by(all_models.Person.email)
    ]
    self._check_ordering("TaskGroup", sorted_titles, "Assignee")
