# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests 'Daily email digest'."""

import ddt

from integration.ggrc.api_helper import Api
from integration.ggrc_basic_permissions.models \
    import factories as rbac_factories
from integration.ggrc import TestCase
from integration.ggrc.models import factories
from ggrc.models import all_models


@ddt.ddt
class TestEnableDisableNotifications(TestCase):
  """Test enable / disable notifications by user with
  specific global role.
  """
  def setUp(self):
    super(TestEnableDisableNotifications, self).setUp()
    self.api = Api()

  @ddt.data("Reader", "Creator", "Editor", "Administrator")
  def test_default_notif_settings(self, role_name):
    """Test setting 'Daily email digest' checkbox to False
    by the user with global role {0}."""
    with factories.single_commit():
      name = "Test Name"
      email = "test_name@example.com"
      person = factories.PersonFactory(name=name, email=email)
      role = all_models.Role.query.filter(
          all_models.Role.name == role_name
      ).one()
      rbac_factories.UserRoleFactory(role=role,
                                     person=person)
    person = all_models.Person.query.get(person.id)
    self.api.set_user(person=person)
    response = self.api.post(
        all_models.NotificationConfig,
        data={
            "notification_config": {
                "person_id": person.id,
                "notif_type": "Email_Digest",
                "enable_flag": True,
                "context": {
                    "id": None,
                    "type": "Context"
                }
            }
        },
    )
    self.assertEqual(response.status_code, 201)

  @ddt.data("Reader", "Creator", "Editor", "Administrator")
  def test_get_notif_settings(self, role_name):
    """Tests notification configs list is returned after
    it has been established by the user with role {0}."""
    with factories.single_commit():
      name = "Test Name"
      email = "test_name@example.com"
      person = factories.PersonFactory(name=name, email=email)
      role = all_models.Role.query.filter(
          all_models.Role.name == role_name
      ).one()
      rbac_factories.UserRoleFactory(role=role,
                                     person=person)
    person = all_models.Person.query.get(person.id)
    self.api.set_user(person=person)
    response = self.api.post(
        all_models.NotificationConfig,
        data={
            "notification_config": {
                "person_id": person.id,
                "notif_type": "Email_Digest",
                "enable_flag": True,
                "context": {
                    "id": None,
                    "type": "Context"
                }
            }
        },
    )
    self.assertEqual(response.status_code, 201)
    response = self.api.get_query(all_models.NotificationConfig,
                                  "person_id=%s" % person.id)
    result_configs_list = response.json['notification_configs_collection']
    self.assertTrue(result_configs_list['notification_configs'] != [])
