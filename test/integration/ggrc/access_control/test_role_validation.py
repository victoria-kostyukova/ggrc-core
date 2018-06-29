# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test Access Control List validation."""

from ggrc import db
from ggrc.models import all_models
from integration.ggrc import TestCase, Api
from integration.ggrc.models import factories


class TestAccessControlListValidation(TestCase):
  """Test AccessControlList validation."""

  def setUp(self):
    super(TestAccessControlListValidation, self).setUp()
    self.api = Api()
    self.client.get("/login")

    role_ids = db.session.query(
        all_models.AccessControlRole.id
    ).filter(
        all_models.AccessControlRole.object_type.in_(("Control", "Objective")),
        all_models.AccessControlRole.name == "Admin"
    ).order_by(all_models.AccessControlRole.object_type)
    role_ids = [id_[0] for id_ in role_ids]

    self.control_admin_acr_id, self.objective_admin_acr_id = role_ids

  def test_create_with_wrong_acl(self):
    """Test creation of object with wrong ACR in ACL."""
    response = self.api.post(all_models.Control, {
        "control": {
            "title": "Control title",
            "context": None,
            "access_control_list": [{
                "ac_role_id": self.objective_admin_acr_id,
                "person": {
                    "type": "Person",
                    "id": factories.PersonFactory().id,
                }
            }],
        },
    })
    self.assert400(response)
    self.assertEqual(all_models.Control.query.count(), 0)

  def test_update_with_wrong_acl(self):
    """Test update of object with wrong ACR in ACL."""
    with factories.single_commit():
      control = factories.ControlFactory()
      control_id = control.id
      person_id = factories.PersonFactory().id
      factories.AccessControlListFactory(
          object_type="Control",
          object_id=control_id,
          person_id=person_id,
          ac_role_id=self.control_admin_acr_id
      )

    response = self.api.put(
        control,
        {
            "access_control_list": [{
                "ac_role_id": self.objective_admin_acr_id,
                "person": {
                    "type": "Person",
                    "id": person_id,
                }
            }]
        }
    )
    self.assert400(response)

    acls = all_models.AccessControlList.query.filter_by(
        object_type="Control",
        object_id=control_id
    )
    for acl in acls:
      acl_obj_type = acl.object_type
      acr_obj_type = acl.ac_role.object_type
      self.assertEqual(acl_obj_type, acr_obj_type)
