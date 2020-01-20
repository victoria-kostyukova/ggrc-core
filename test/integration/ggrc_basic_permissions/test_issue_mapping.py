# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test Mapping Issue mapping"""

from ddt import data, ddt, unpack
from ggrc.app import app  # NOQA pylint: disable=unused-import
from ggrc.models import all_models
from integration.ggrc import TestCase
from integration.ggrc.api_helper import Api
from integration.ggrc.models import factories
from integration.ggrc_basic_permissions.models \
    import factories as rbac_factories


def _get_map_dict(destination, source):
  return {
      'relationship': {
          "context": {
              "id": destination.context.id,
              "type": "Context"
          },
          "source": {
              "id": source.id,
              "type": source.type
          },
          "destination": {
              "id": destination.id,
              "type": destination.type
          }
      }
  }


@ddt
class TestIssueMapping(TestCase):
  """Test Issue mapping"""

  def setup_roles(self):
    """Setup necessary roles needed by the tests"""
    query = all_models.Role.query
    self.roles = {
        'creator': query.filter_by(name="Creator").first(),
    }

  def setup_users(self):
    """Creates two creator users"""
    self.users = {}
    for user_name in ('auditor', 'programeditor'):
      user = factories.PersonFactory()
      rbac_factories.UserRoleFactory(
          role=self.roles['creator'],
          person=user,
      )
      self.users[user_name] = user

  def setup_audits(self):
    """Create an audit and an archived audit"""
    self.audits = {
        False: self.create_audit(archived=False),
        True: self.create_audit(archived=True)
    }

  def setup_snapshots_and_issue(self):
    """Create snapshot & issue objects"""
    self.snapshots = {}
    self.issues = {}
    self.control = factories.ControlFactory()
    for is_archived in (False, True):
      audit = self.audits[is_archived]
      self.snapshots[is_archived] = self._create_snapshots(
          audit,
          [self.control],
      )[0]
      factories.RelationshipFactory(
          source=audit,
          destination=self.snapshots[is_archived],
      )

      # Create an issue
      issue = factories.IssueFactory()
      self.issues[is_archived] = issue
      # Map issue to audit
      factories.RelationshipFactory(
          source=audit,
          destination=issue,
          context=audit.context
      )

  def create_audit(self, archived=False):
    """Create an audit object and fix the it's context"""
    audit = factories.AuditFactory(archived=archived)
    factories.RelationshipFactory(
        source=audit,
        destination=audit.program,
    )
    # Add auditor & program editor roles
    factories.AccessControlPersonFactory(
        ac_list=audit.acr_name_acl_map["Auditors"],
        person=self.users['auditor'],
    )
    factories.AccessControlPersonFactory(
        ac_list=audit.program.acr_name_acl_map["Program Editors"],
        person=self.users['programeditor']
    )

    return audit

  def setUp(self):
    """Prepare data needed to run the tests"""
    super(TestIssueMapping, self).setUp()
    self.api = Api()
    self.setup_roles()
    self.setup_users()
    self.setup_audits()
    self.setup_snapshots_and_issue()

  @data(
      # user_name, is_archived
      ('auditor', True),
      ('programeditor', True),
      ('auditor', False),
      ('programeditor', False),
  )
  @unpack
  def test_mapping_to_issue(self, user_name, is_archived):
    """Test mapping snapshots to issue for {0} ({1})"""
    user = self.users[user_name]
    payload = _get_map_dict(
        self.snapshots[is_archived],
        self.issues[is_archived])
    self.api.set_user(user)

    # Try to map to audit
    response = self.api.post(all_models.Relationship, payload)
    self.assertStatus(response, 201)

    rel_id = response.json['relationship']['id']
    relationship = all_models.Relationship.query.filter_by(id=rel_id).first()
    response = self.api.delete(relationship)
    self.assertStatus(response, 200)
