# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Collects all permission tests for ACR model."""

import ddt

from ggrc.models import all_models

from integration.ggrc import TestCase
from integration.ggrc.api_helper import Api
from integration.ggrc.models import factories
from integration.ggrc_basic_permissions.models \
    import factories as rbac_factories


@ddt.ddt
class TestACRPermissions(TestCase):
  """TestCase permissions for ACR model."""

  def setUp(self):
    super(TestACRPermissions, self).setUp()
    self.api = Api()
    self.client.get("/login")
    self.obj_type = "Control"
    roles = {r.name: r for r in all_models.Role.query.all()}
    with factories.single_commit():
      self.people = {
          "Creator": factories.PersonFactory(),
          "Reader": factories.PersonFactory(),
          "Editor": factories.PersonFactory(),
          "Administrator": factories.PersonFactory(),
      }
      for role_name in ["Creator", "Reader", "Editor", "Administrator"]:
        rbac_factories.UserRoleFactory(role=roles[role_name],
                                       person=self.people[role_name])
      self.fake_role = factories.AccessControlRoleFactory(
          name="ACL_Reader",
          object_type=self.obj_type)

  @ddt.data("Creator", "Reader", "Editor", "Administrator")
  def test_get_acr(self, role):
    """Test get access_control_roles for {}"""
    fake_role_id = self.fake_role.id
    self.api.set_user(self.people[role])
    self.client.get("/login")
    headers = {"Content-Type": "application/json", }
    resp = self.api.client.get(
        "/api/access_control_roles?object_type={}".format(self.obj_type),
        headers=headers)
    self.assert200(resp)
    self.assertIn("access_control_roles_collection", resp.json)
    acrs = resp.json["access_control_roles_collection"]["access_control_roles"]
    self.assertIn(fake_role_id, [i["id"] for i in acrs])
