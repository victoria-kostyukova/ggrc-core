# Copyright (C) 2019 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test Access Control Role"""
from collections import OrderedDict, defaultdict

import ddt

from ggrc import settings
from ggrc.access_control.role import AccessControlRole
from ggrc.converters import errors
from ggrc.models import all_models
from integration.ggrc import TestCase
from integration.ggrc.api_helper import Api
from integration.ggrc.models.factories import random_str
from integration.ggrc.models import factories
from integration.ggrc.generator import ObjectGenerator

ROLE_NAME = "ACR for mandatory test"
MANDATORY_ROLE_RESPONSE = {
    "Risk": {"row_warnings": {errors.OWNER_MISSING.format(
        line=3, column_name=ROLE_NAME)}}}
NON_MANDATORY_ROLE_RESPONSE = {}


@ddt.ddt
class TestAccessControlRole(TestCase):
  """TestAccessControlRole"""

  def setUp(self):
    self.clear_data()
    super(TestAccessControlRole, self).setUp()
    self.api = Api()
    self.object_generator = ObjectGenerator()
    self.people = {}
    for name in ["Creator", "Reader", "Editor"]:
      _, user = self.object_generator.generate_person(
          data={"name": name}, user_role=name)
      self.people[name] = user

  def _post_role(self, name=None, object_type="Control"):
    """Helper function for POSTing roles"""
    if name is None:
      name = random_str(prefix="Access Control Role - ")
    return self.api.post(AccessControlRole, {
        "access_control_role": {
            "name": name,
            "object_type": object_type,
            "context": None,
            "read": True
        },
    })

  def test_create_after_objects(self):
    """Test eager creation of ACLs on existing objects with new ACR."""
    control_id = factories.ControlFactory().id
    role_name = "New Custom Role"
    self._post_role(name=role_name)
    control = all_models.Control.query.get(control_id)
    self.assertIn(role_name, control.acr_name_acl_map.keys())
    self.assertIsNotNone(control.acr_name_acl_map[role_name])

  def test_create(self):
    """Test Access Control Role creation"""
    response = self._post_role()
    assert response.status_code == 201, \
        "Failed to create a new access control role, response was {}".format(
            response.status)

    id_ = response.json['access_control_role']['id']
    role = AccessControlRole.query.filter(AccessControlRole.id == id_).first()
    assert role.read == 1, \
        "Read permission not correctly saved {}".format(role.read)
    assert role.update == 1, \
        "Update permission not correctly saved {}".format(role.update)
    assert role.delete == 1, \
        "Update permission not correctly saved {}".format(role.delete)

  @ddt.data(
      {"mandatory": True, "exp_response": MANDATORY_ROLE_RESPONSE},
      {"mandatory": False, "exp_response": NON_MANDATORY_ROLE_RESPONSE},
  )
  @ddt.unpack
  def test_mandatory_delete(self, mandatory, exp_response):
    """Test set empty field via import if acr mandatory is {mandatory}"""
    role = factories.AccessControlRoleFactory(
        name=ROLE_NAME,
        object_type="Risk",
        mandatory=mandatory,
    )
    with factories.single_commit():
      user = factories.PersonFactory()
      risk = factories.RiskFactory()
      role_id = role.id
      factories.AccessControlPersonFactory(
          ac_list=risk.acr_name_acl_map[ROLE_NAME],
          person=user,
      )
    response = self.import_data(OrderedDict([
        ("object_type", "Risk"),
        ("Code*", risk.slug),
        (ROLE_NAME, "--"),
    ]))
    self._check_csv_response(response, exp_response)
    db_data = defaultdict(set)
    risk = all_models.Risk.query.get(risk.id)
    for person, acl in risk.access_control_list:
      db_data[acl.ac_role_id].add(person.id)
    if mandatory:
      cur_user = all_models.Person.query.filter_by(
          email="user@example.com").first()
      self.assertEqual(set([cur_user.id]), db_data[role_id])
    else:
      self.assertFalse(db_data[role_id])

  def test_only_admin_can_post(self):
    """Only admin users should be able to POST access control roles"""
    for name in ("Creator", "Reader", "Editor"):
      person = self.people.get(name)
      self.api.set_user(person)
      response = self._post_role()
      assert response.status_code == 403, \
          "Non admins should get forbidden error when POSTing role. {}".format(
              response.status)

  @ddt.data(
      ("name", "New ACR"),
      ("read", False),
      ("mandatory", False),
      ("non_editable", False),
  )
  @ddt.unpack
  def test_modify_non_editable_role(self, field_name, field_value):
    """Test if user can modify non-editable role"""
    # Primary Contacts role of Control is non-editable
    ac_role = AccessControlRole.query.filter_by(
        object_type="Control",
        name="Control Operators",
    ).first()

    response = self.api.put(ac_role, {field_name: field_value})
    assert response.status_code == 403, \
        "Forbidden error should be thrown when non-editable " \
        "role {} updated.".format(ac_role.name)

  def test_delete_non_editable_role(self):
    """Test if user can delete non-editable role"""
    # Primary Contacts role of Control is non-editable
    ac_role = AccessControlRole.query.filter_by(
        object_type="Control",
        name="Control Operators",
    ).first()

    response = self.api.delete(ac_role)
    assert response.status_code == 403, \
        "Forbidden error should be thrown when non-editable " \
        "role {} deleted.".format(ac_role.name)

  @ddt.data("Control")
  def test_create_from_ggrcq(self, object_type):
    """Test that create action only for GGRCQ."""
    self.api.headers.update(
        {"X-Requested-By": settings.GGRC_Q_ACTION_HEADER}
    )
    response = self._post_role(object_type=object_type)
    self.assertEqual(response.status_code, 201)

  @ddt.data("Control")
  def test_create_from_ggrc(self, object_type):
    """Test create action not allowed for GGRC."""
    response = self._post_role(object_type=object_type)
    self.assertEqual(response.status_code, 405)
