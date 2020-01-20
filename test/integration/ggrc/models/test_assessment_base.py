# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test assessment base class used by test_assessment and
   test_assessment_generation modules"""

from ggrc import db
from ggrc.access_control.role import get_custom_roles_for
from ggrc.models import all_models

from integration import ggrc


class TestAssessmentBase(ggrc.TestCase):
  """Base class for Assessment tests"""
  def setUp(self):
    super(TestAssessmentBase, self).setUp()
    self.api = ggrc.api_helper.Api()
    self.assignee_roles = {
        role_name: role_id
        for role_id, role_name in get_custom_roles_for("Assessment").items()
        if role_name in ["Assignees", "Creators", "Verifiers"]
    }

  def assert_propagated_role(self, base_role_name, person_email, mapped_obj):
    """Check that a person has a role that is propagated from base role.

    Args:
      base_role_name: role name of the base ACL that should be propagated to
        the current object.
      person_email: email of the person that should be propagated.
      mapped_obj: object which should contain a child ACL entry.
    """
    acl_prop = db.aliased(all_models.AccessControlList)
    acl_base = db.aliased(all_models.AccessControlList)
    query = all_models.AccessControlPerson.query.join(
        acl_base,
        acl_base.id == all_models.AccessControlPerson.ac_list_id,
    ).join(
        acl_prop,
        acl_prop.base_id == acl_base.id,
    ).join(
        all_models.AccessControlRole,
    ).join(
        all_models.Person,
    ).filter(
        all_models.AccessControlList.object_id == mapped_obj.id,
        all_models.AccessControlList.object_type == mapped_obj.type,
        all_models.Person.email == person_email,
        all_models.AccessControlRole.name.like("{}*%".format(base_role_name)),
    )
    self.assertNotEqual(query.count(), 0)

  def assert_mapped_role(self, role, person_email, mapped_obj):
    """Check if required role was created for mapped object"""
    query = all_models.AccessControlPerson.query.join(
        all_models.AccessControlList,
    ).join(
        all_models.AccessControlRole,
    ).join(
        all_models.Person,
    ).filter(
        all_models.AccessControlList.object_id == mapped_obj.id,
        all_models.AccessControlList.object_type == mapped_obj.type,
        all_models.Person.email == person_email,
        all_models.AccessControlRole.name == role,
    )
    self.assertEqual(query.count(), 1)

  def assessment_post(self, template=None, extra_data=None):
    """Helper function to POST an assessment"""
    assessment_dict = {
        "_generated": True,
        "audit": {
            "id": self.audit.id,
            "type": "Audit"
        },
        "object": {
            "id": self.snapshot.id,
            "type": "Snapshot"
        },
        "context": {
            "id": self.audit.context.id,
            "type": "Context"
        },
        "title": "Temp title"
    }
    if template:
      assessment_dict["template"] = {
          "id": template.id,
          "type": "AssessmentTemplate"
      }
    if extra_data:
      assessment_dict.update(extra_data)

    response = self.api.post(all_models.Assessment, {
        "assessment": assessment_dict
    })
    if response.status_code == 201:
      id_ = response.json['assessment']['id']
      return self.api.get(all_models.Assessment, id_)
    return response
