# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test Access Control Propagation for BackgroundTask roles."""

from ggrc.models import all_models
from integration.ggrc import TestCase, api_helper
from integration.ggrc.models import factories
from integration.ggrc_basic_permissions.models \
    import factories as rbac_factories


class TestBackgroundTaskRolePropagation(TestCase):
  """Test Access Control Propagation for BackgroundTask."""

  def setup_people(self):
    """Setup people and global roles"""
    creator_role = all_models.Role.query.filter(
        all_models.Role.name == 'Creator'
    ).one()

    for person in [
        ("created_captain", "createdcaptain@example.com"),
        ("created_auditor", "createdauditor@example.com"),
        ("updated_captain", "updatedcaptain@example.com"),
        ("updated_auditor", "updatedauditor@example.com"),
        ("issue_admin", "issueadmin@example.com"),
    ]:
      self.people[person[0]] = factories.PersonFactory(
          email=person[1])
      rbac_factories.UserRoleFactory(
          role=creator_role,
          person=self.people[person[0]]
      )

  def setup_objects(self):
    """Sets up all the objects needed by the tests"""
    objects = self.objects

    # Program
    objects['program'] = program = factories.ProgramFactory(title="A Program")

    # Controls
    objects['controls'] = controls = [
        factories.ControlFactory(title="My First Control"),
        factories.ControlFactory(title="My Second Control")
    ]

    # Controls <-> Program mapping
    for control in controls:
      factories.RelationshipFactory(source=program,
                                    destination=control)

    # Audit
    objects['audit'] = audit = factories.AuditFactory(
        program=objects['program'],
        access_control_list=[{
            "ac_role_id": self.audit_roles['Auditors'].id,
            "person": {"id": self.people['created_auditor'].id},
        }, {
            "ac_role_id": self.audit_roles['Audit Captains'].id,
            "person": {"id": self.people['created_captain'].id},
        }]
    )
    factories.RelationshipFactory(source=program, destination=audit)

    # Assessment template
    objects['assessment_template'] = template = \
        factories.AssessmentTemplateFactory()
    factories.RelationshipFactory(source=audit, destination=template)

    # Snapshot
    objects['snapshots'] = self._create_snapshots(audit, controls)
    for snapshot in objects['snapshots']:
      factories.RelationshipFactory(source=audit, destination=snapshot)

  def setUp(self):
    super(TestBackgroundTaskRolePropagation, self).setUp()
    self.api = api_helper.Api()
    self.people = {}
    self.objects = {}
    self.audit_roles = {
        role.name: role for role in
        all_models.AccessControlRole.query.filter().all()
    }
    with factories.single_commit():
      self.setup_people()
      self.setup_objects()

  def test_bg_task_created(self):
    """Test that Global Creator has rights to fetch BG task. """
    objects = self.objects
    assessment_dict = {
        "_generated": True,
        "audit": {
            "id": objects['audit'].id,
            "type": "Audit"
        },
        "object": {
            "id": objects['snapshots'][0].id,
            "type": "Snapshot"
        },
        "title": "Temp title",
        "template": {
            "id": objects['assessment_template'].id,
            "type": "AssessmentTemplate"
        },
        "context": {
            "type": "Context",
            "id": objects['audit'].context_id,
        },
    }

    self.api.set_user(self.people["created_auditor"])
    response = self.api.send_request(
        self.api.client.post,
        all_models.Assessment,
        [{"assessment": assessment_dict}],
        {"X-GGRC-BackgroundTask": "true"},
    )
    self.assertEqual(response.status_code, 200)
    bg_tasks = all_models.BackgroundTask.query.all()
    self.assertEqual(len(bg_tasks), 2)

    content = self.api.client.get(
        "/api/background_tasks?id__in={}".format(bg_tasks[0].id)
    )
    self.assert200(content)
    bg_tasks_content = \
        content.json['background_tasks_collection']['background_tasks']
    self.assertEqual(len(bg_tasks_content), 1)
    self.assertEqual(bg_tasks_content[0]['id'], bg_tasks[0].id)
