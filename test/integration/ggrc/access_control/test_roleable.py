# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test Access Control Roleable mixin"""
import ddt
from ggrc import db
from ggrc.access_control import roleable
from ggrc.models import all_models
from integration.ggrc import TestCase
from integration.ggrc import api_helper
from integration.ggrc.models import factories


@ddt.ddt
class TestAccessControlRoleable(TestCase):
  """Test AccessControlList"""

  def setUp(self):
    super(TestAccessControlRoleable, self).setUp()
    with factories.single_commit():
      self.role = factories.AccessControlRoleFactory(object_type="Control")
      self.person = factories.PersonFactory()

  @ddt.data(*[
      model for model in all_models.all_models
      if issubclass(model, roleable.Roleable)
  ])
  def test_inital_role_setup(self, model):
    """Check generating acl entries for {0.__name__}."""
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

  def test_with_dict(self):
    acl_list = [{
        "ac_role_id": self.role.id,
        "person": {
            "id": self.person.id
        }
    }]
    """Test access_control_list setter with a basic dict object
    This is the format the frontend uses"""
    obj = all_models.Control(
        title="New Control",
        access_control_list=acl_list
    )
    self.assertIsNotNone(obj.access_control_list)
    person, acl = obj.access_control_list[0]
    self.assertIsNotNone(acl)
    self.assertIsInstance(acl, all_models.AccessControlList)
    self.assertEqual(person.id, self.person.id)
    self.assertEqual(acl.ac_role.id, self.role.id)
    self.assertEqual(acl.object, obj)

  def test_with_dict_objs_multiple(self):
    """Test access_control_list setter without ids"""
    role = factories.AccessControlRoleFactory(object_type="Control")

    def acl_query():
      return db.session.query(
          all_models.AccessControlPeople.person_id,
      ).join(
          all_models.AccessControlList
      ).filter(
          all_models.AccessControlList.object_id == obj.id,
          all_models.AccessControlList.object_type == "Control"
      ).all()
    person_1 = factories.PersonFactory(name="Frodo", email="frodo@baggins.com")
    person_2 = factories.PersonFactory(name="Bilbo", email="bilbo@baggins.com")
    person_3 = factories.PersonFactory(name="Merry", email="merry@buck.com")
    obj = all_models.Control(title="Test Control")
    obj.access_control_list = [{
        "person": {
            "id": person_1.id,
        },
        "ac_role_id": role.id,
    }, {
        "person": {
            "id": person_2.id,
        },
        "ac_role_id": role.id,
    }]
    db.session.commit()

    acls = acl_query()
    self.assertItemsEqual([
        (person_1.id, ),
        (person_2.id, ),
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

    acls = acl_query()
    self.assertItemsEqual([
        (person_2.id, ),
        (person_3.id, ),
    ], acls)
