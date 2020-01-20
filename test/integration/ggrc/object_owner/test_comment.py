# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test object owner of comments."""
from collections import OrderedDict
import ddt

from ggrc.models import Assessment, AccessControlList, Revision, all_models
from integration.ggrc import api_helper
from integration.ggrc import TestCase
from integration.ggrc.models import factories
from integration.ggrc_basic_permissions.models \
    import factories as rbac_factories


@ddt.ddt
class TestCommentAdmin(TestCase):

  """Test Admin role on comments."""

  def setUp(self):
    """Setup test case."""
    super(TestCommentAdmin, self).setUp()
    self.api = api_helper.Api()
    self.response = self.client.get("/login")

  @staticmethod
  def _get_assessment_import_data(audit_slug, assignees=None, creators=None):
    """Return import Assessment data block"""
    data_block = [
        OrderedDict([
            ("object_type", "Assessment"),
            ("Code*", ""),
            ("Audit*", audit_slug),
            ("Title*", "Assessment title 1"),
            ("Description", "Some desc 1"),
            ("Notes", "notes 1"),
            ("State*", "NOT STARTED"),
            ("Recipients", "Verifiers, Assignees"),
            ("Send by default", "Yes"),
            ("Evidence URL", "http://i.imgur.com/Lppr347.jpg")
        ]),
    ]

    if assignees:
      data_block[0]["Assignees*"] = assignees
    if creators:
      data_block[0]["Creators*"] = creators

    return data_block

  # pylint: disable=too-many-locals
  @ddt.data(
      ("Administrator", "assignees,creators", "testadmin@example.com"),
      ("Creator", "assignees,creators", "testcreator@example.com"),
      ("Editor", "assignees,creators", "testeditor@example.com"),
      ("Reader", "assignees,creators", "testreader@example.com"),
  )
  @ddt.unpack
  def test_admin_role(self, role, assessment_roles, email):
    """Test comment Admin and its revision of assessment comment."""
    person = factories.PersonFactory(email=email)
    person_id = person.id
    creator_role = all_models.Role.query.filter(
        all_models.Role.name == role
    ).one()
    rbac_factories.UserRoleFactory(role=creator_role, person=person)

    audit = factories.AuditFactory()

    assessment_roles = dict.fromkeys(assessment_roles.split(','), email)
    data_block = self._get_assessment_import_data(audit.slug,
                                                  **assessment_roles)
    response = self.import_data(*data_block)
    self._check_csv_response(response, {})

    asmt1 = Assessment.query.filter_by(title="Assessment title 1").first()

    self.api.set_user(all_models.Person.query.get(person_id))
    request_data = [{
        "comment": {
            "description": "<p>{}</p>".format("some comment"),
            "context": None,
            "assignee_type": "Assignees,Verifiers,Creators",
        },
    }]

    # logged user will be set as comment admin
    self.api.post(all_models.Comment, request_data)
    comment = all_models.Comment.query.first()
    self.api.put(asmt1, {
        "actions": {"add_related": [{"id": comment.id,
                                     "type": "Comment"}]},
    })

    acr_comment_id = all_models.AccessControlRole.query.filter_by(
        object_type="Comment",
        name="Admin"
    ).first().id
    acl = AccessControlList.query.filter_by(
        object_id=comment.id,
        object_type=comment.type,
        ac_role_id=acr_comment_id
    ).first()
    self.assertTrue(acl, "ACL row is not created")

    revision = Revision.query.filter_by(
        resource_id=acl.id,
        resource_type=acl.type
    ).first()
    self.assertTrue(revision, "Revision of ACL is not created")
