# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test automappings"""

import ddt

from ggrc.models import all_models
from integration.ggrc import TestCase
from integration.ggrc import api_helper
from integration.ggrc.access_control import acl_helper
from integration.ggrc.models import factories
from integration.ggrc_basic_permissions.models \
    import factories as rbac_factories


@ddt.ddt
class TestAutomappings(TestCase):
  """Test automappings"""

  def setUp(self):
    super(TestAutomappings, self).setUp()
    self.api = api_helper.Api()
    with factories.single_commit():
      creator_role = all_models.Role.query.filter(
          all_models.Role.name == "Creator").first()
      reader_role = all_models.Role.query.filter(
          all_models.Role.name == "Reader").first()
      creator_pm = factories.PersonFactory(
          email="Creator_and_ProgramManager@example.com"
      )
      creator_auditor = factories.PersonFactory(
          email="Creator_and_Auditor@example.com"
      )
      reader_pm = factories.PersonFactory(
          email="Reader_and_ProgramManager@example.com"
      )
      reader_auditor = factories.PersonFactory(
          email="Reader_and_Auditor@example.com"
      )
      rbac_factories.UserRoleFactory(
          role=creator_role, person=creator_pm)
      rbac_factories.UserRoleFactory(
          role=creator_role, person=creator_auditor)
      rbac_factories.UserRoleFactory(
          role=reader_role, person=reader_pm)
      rbac_factories.UserRoleFactory(
          role=reader_role, person=reader_auditor)
      program = factories.ProgramFactory()
      audit = factories.AuditFactory(program=program)
      factories.RelationshipFactory(source=program, destination=audit)
      assessment = factories.AssessmentFactory(audit=audit)
      factories.RelationshipFactory(source=audit, destination=assessment)
      program.add_person_with_role_name(creator_pm, "Program Managers")
      program.add_person_with_role_name(reader_pm, "Program Managers")
      audit.add_person_with_role_name(creator_pm, "Audit Captains")
      audit.add_person_with_role_name(creator_auditor, "Auditors")
      assessment.add_person_with_role_name(creator_pm, "Creators")
      assessment.add_person_with_role_name(reader_pm, "Creators")
      assessment.add_person_with_role_name(creator_pm, "Assigness")
      assessment.add_person_with_role_name(reader_pm, "Assigness")
      assessment.add_person_with_role_name(creator_auditor, "Assigness")
      assessment.add_person_with_role_name(reader_auditor, "Assigness")

    self.issue_admin_role = all_models.AccessControlRole.query.filter_by(
        name="Admin",
        object_type="Issue",
    ).one()

  def _login_as(self, user_email):
    """Helper function to send all further requests as given user."""
    user = all_models.Person.query.filter(
        all_models.Person.email == user_email,
    ).one()
    self.api.set_user(user)
    return user

  def _create_audit(self, program, extra_data=None):
    """Helper function to create audit for given program."""
    audit_data = {
        "title": "Some title",
        "program": {
            "id": program.id,
            "type": program.type,
        },
        "status": "Planned",
        "context": None,
    }
    if extra_data is not None:
      audit_data.update(extra_data)
    response = self.api.post(
        all_models.Audit, {"audit": audit_data}
    )
    self.assertStatus(response, 201)
    return all_models.Audit.query.get(
        response.json["audit"]["id"],
    )

  def _autogenerate_assessment(self, audit, snapshot, extra_data=None):
    """Helper function to autogenerate assessment on audit from snapshot."""
    assessment_data = {
        "_generated": True,
        "audit": {
            "id": audit.id,
            "type": audit.type,
        },
        "object": {
            "id": snapshot.id,
            "type": snapshot.type,
        },
        "context": {
            "id": audit.context.id,
            "type": audit.context.type,
        },
        "title": "Some title",
    }
    if extra_data is not None:
      assessment_data.update(extra_data)
    response = self.api.post(
        all_models.Assessment, {"assessment": assessment_data}
    )
    self.assertStatus(response, 201)
    return all_models.Assessment.query.get(
        response.json["assessment"]["id"],
    )

  def _raise_issue(self, assessment, extra_data=None):
    """Helper function to raise an issue on assessment."""
    issue_data = {
        "status": "Draft",
        "assessment": {
            "type": assessment.type,
            "id": assessment.id,
        },
        "title": "aa",
        "context": None,
        "due_date": "10/10/2019"
    }
    if extra_data is not None:
      issue_data.update(extra_data)
    response = self.api.post(
        all_models.Issue, {"issue": issue_data}
    )
    self.assertStatus(response, 201)
    return all_models.Issue.query.get(
        response.json["issue"]["id"],
    )

  @ddt.data(
      "user@example.com",
      "Creator_and_ProgramManager@example.com",
      "Creator_and_Auditor@example.com",
      "Reader_and_ProgramManager@example.com",
      "Reader_and_Auditor@example.com",
  )
  def test_issue_audit_creator(self, user_email):
    """Test automapping issue to audit for {}.

    This test should check if the issue is automapped to an audit when a
    creator raises an issue on an assessment that belongs to the given audit.
    """
    user_id = self._login_as(user_email).id
    issued_admin_role_id = self.issue_admin_role.id

    assessment = all_models.Assessment.query.first()
    issue = self._raise_issue(
        assessment,
        extra_data={
            "access_control_list": [
                acl_helper.get_acl_json(issued_admin_role_id, user_id),
            ],
        },
    )

    audit = all_models.Audit.query.first()
    relationship = all_models.Relationship.find_related(issue, audit)
    self.assertIsNotNone(relationship)
    self.assertEqual(audit.context_id, issue.context_id)

  @ddt.data(
      "user@example.com",
      "Creator_and_ProgramManager@example.com",
  )
  def test_snapshot_issue_creator(self, user_email):
    """Test automapping control snapshot to issue.

    This test should check if the control snapshot is automapped to an issue
    raised by a creator on an assessment that belongs to the given audit.
    """
    user_id = self._login_as(user_email).id
    issued_admin_role_id = self.issue_admin_role.id

    program = all_models.Program.query.first()
    with factories.single_commit():
      control = factories.ControlFactory(
          slug="control-1",
          title="control-1",
          description="descr",
          assertions='["Security"]'
      )
      control_id = control.id
    factories.RelationshipFactory(
        source=program,
        destination=control,
    )

    audit = self._create_audit(program)
    snapshot = all_models.Snapshot.query.filter(
        all_models.Snapshot.child_type == control.type,
        all_models.Snapshot.child_id == control_id,
    ).one()
    assessment = self._autogenerate_assessment(audit, snapshot)
    issue = self._raise_issue(
        assessment,
        extra_data={
            "access_control_list": [
                acl_helper.get_acl_json(issued_admin_role_id, user_id),
            ],
        },
    )

    snapshot = all_models.Snapshot.query.filter(
        all_models.Snapshot.child_type == control.type,
        all_models.Snapshot.child_id == control_id,
    ).one()
    relationship = all_models.Relationship.find_related(issue, snapshot)
    self.assertIsNotNone(relationship)
    self.assertEqual(issue.context_id, snapshot.context_id)
