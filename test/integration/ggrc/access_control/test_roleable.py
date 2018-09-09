# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test Access Control Roleable mixin"""
import ddt
from ggrc import app
from ggrc import db
from ggrc.models import all_models
from ggrc.access_control import roleable
from integration.ggrc import TestCase
from integration.ggrc.models import factories


@ddt.ddt
class TestAccessControlRoleable(TestCase):
  """Test AccessControlList"""

  def setUp(self):
    super(TestAccessControlRoleable, self).setUp()
    with factories.single_commit():
      self.role = factories.AccessControlRoleFactory()
      self.person = factories.PersonFactory()

  @ddt.data(*[
      model for model in all_models.all_models
      if issubclass(model, roleable.Roleable)
  ])
  def test_inital_role_setup(self, model):
    """Check generating acl entries for {0.__name__}."""
    with app.app.app_context():
      obj = model()
      generated_roles = [acl.ac_role for acl in obj._access_control_list]
      control_visible_roles = all_models.AccessControlRole.query.filter(
          all_models.AccessControlRole.object_type == obj.type,
          all_models.AccessControlRole.internal == 0,
      ).all()
      self.assertItemsEqual(
          generated_roles,
          control_visible_roles,
      )

  @ddt.data(lambda self: [{
      "ac_role_id": self.role.id,
      "person": {
          "id": self.person.id
      }
  }], lambda self: [{
      "person": self.person,
      "ac_role": self.role
  }])
  def test_with_dict(self, acl_list):
    """Test access_control_list setter with a basic dict object
    This is the format the frontend uses"""
    return  # TODO: acp

  def test_with_dict_objs_multiple(self):
    """Test access_control_list setter without ids"""
    return  # TODO: acp

    person_1 = all_models.Person(name="Frodo", email="frodo@baggins.com")
    person_2 = all_models.Person(name="Bilbo", email="bilbo@baggins.com")
    person_3 = factories.PersonFactory(name="Merry", email="merry@buck.com")
    role = all_models.AccessControlRole(name="Hobbit")
    obj = all_models.Control(title="Test Control", access_control_list=[{
        "person": person_1,
        "ac_role": self.role,
    }, {
        "person": person_2,
        "ac_role": role,
    }])
    db.session.commit()
    obj_id = obj.id
    self.assertIsNotNone(obj.access_control_list)
    self.assertEqual(len(obj.access_control_list), 2)
    self.assertEqual(obj.access_control_list[0].person, person_1)
    self.assertEqual(obj.access_control_list[1].person, person_2)

    acl_query = db.session.query(
        all_models.AccessControlList.person_id,
        all_models.AccessControlList.ac_role_id
    ).filter(
        all_models.AccessControlList.object_id == obj_id,
        all_models.AccessControlList.object_type == "Control"
    )

    acls = acl_query.all()
    self.assertItemsEqual([
        (person_1.id, self.role.id),
        (person_2.id, role.id)
    ], acls)

    obj.access_control_list = [{
        "person": {
            "id": person_2.id,
        },
        "ac_role_id": role.id,
    }, {
        "person": {
            "id": person_3.id,
        },
        "ac_role_id": role.id,
    }]
    db.session.commit()

    acls = acl_query.all()
    self.assertItemsEqual([
        (person_2.id, role.id),
        (person_3.id, role.id)
    ], acls)
