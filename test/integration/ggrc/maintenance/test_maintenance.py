# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests maintenance mode"""

import mock

from ggrc import maintenance

from integration.ggrc import TestCase
from integration.ggrc.models.factories import MaintenanceFactory


class TestMaintenance(TestCase):
  """Tests maintenance mode handling"""

  def setUp(self):
    super(TestMaintenance, self).setUp()
    self.client.get("/login")
    self.maintenance_client = maintenance.maintenance_app.test_client()

  def test_page_maintenance(self):
    """Test web page under maintenance"""

    MaintenanceFactory(under_maintenance=True)

    response = self.client.get('/dashboard')

    self.assertStatus(response, 503)
    self.assertIn('text/html', response.content_type)

  def test_api_maintenance(self):
    """Test api under maintenance"""

    MaintenanceFactory(under_maintenance=True)

    response = self.client.get('/api/issues')

    self.assertStatus(response, 503)
    self.assertIn('application/json', response.content_type)

    data = response.json
    self.assertIn("message", data)
    self.assertEqual(data.get("code"), 503)

  def test_page_no_maintenance(self):
    """Test web page without maintenance record"""

    response = self.client.get('/dashboard')

    self.assertStatus(response, 200)
    self.assertIn('text/html', response.content_type)

  def test_page_maintenance_is_false(self):
    """Test web page without maintenance record"""

    MaintenanceFactory(under_maintenance=False)

    response = self.client.get('/dashboard')

    self.assertStatus(response, 200)
    self.assertIn('text/html', response.content_type)

  @mock.patch('ggrc.settings.ACCESS_TOKEN', new='test token')
  def test_turn_on_maintenance_mode(self):
    """Test turn on maintenance mode"""
    response = self.maintenance_client.post(
        '/maintenance/turnon_maintenance_mode',
        data={"access_token": "test token"},
    )
    self.assertStatus(response, 202)
    self.assertEqual(
        response.data,
        "Maintenance mode turned on successfully",
    )

    response = self.client.get('/dashboard')
    self.assertStatus(response, 503)

  @mock.patch('ggrc.settings.ACCESS_TOKEN', new='test token')
  def test_turn_off_maintenance_mode(self):
    """Test turn off maintenance mode"""
    MaintenanceFactory(under_maintenance=True)
    response = self.client.get('/dashboard')
    self.assertStatus(response, 503)

    response = self.maintenance_client.post(
        '/maintenance/turnoff_maintenance_mode',
        data={"access_token": "test token"},
    )
    self.assertStatus(response, 202)
    self.assertEqual(
        response.data,
        "Maintenance mode turned off successfully",
    )

    response = self.client.get('/dashboard')
    self.assertStatus(response, 200)

  @mock.patch('ggrc.settings.ACCESS_TOKEN', new='test token')
  def test_turn_off_no_record_maintenance_mode(self):
    """Test can't turn off maintenance mode before turning on"""
    # pylint: disable=invalid-name

    response = self.maintenance_client.post(
        '/maintenance/turnoff_maintenance_mode',
        data={"access_token": "test token"},
    )
    self.assertStatus(response, 202)
    self.assertEqual(
        response.data,
        "Maintenance mode has was not turned on.",
    )
