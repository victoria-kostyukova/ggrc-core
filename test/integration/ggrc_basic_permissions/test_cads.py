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
from integration.ggrc import generator


@ddt.ddt
class TestCADPermissions(TestCase):
  """TestCase permissions for CAD model."""

  def setUp(self):
    super(TestCADPermissions, self).setUp()
    self.api = Api()
    self.client.get("/login")
    self.definition_type = "objective"
    self.generator = generator.ObjectGenerator()
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
      self.fake_cad = factories.CustomAttributeDefinitionFactory(
          definition_type=self.definition_type
      )

  @ddt.data("Creator", "Reader", "Editor", "Administrator")
  def test_get_cads(self, role):
    """Test get CADs for {}"""
    fake_cad_id = self.fake_cad.id
    filter_params = "ids={}&definition_type={}".format(
        fake_cad_id, self.fake_cad.definition_type)
    self.api.set_user(self.people[role])
    self.client.get("/login")
    resp = self.generator.api.get_query(all_models.CustomAttributeDefinition,
                                        filter_params)
    self.assert200(resp)
    cad_collection = resp.json["custom_attribute_definitions_collection"]
    resp_cad_ids = [
        i["id"] for i in cad_collection["custom_attribute_definitions"]
    ]
    self.assertEqual([self.fake_cad.id], resp_cad_ids)
