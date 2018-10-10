# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>


"""Tests for task group task specific export."""
from ggrc import db
from ggrc.models import all_models
from integration.ggrc.models import factories
from integration.ggrc import TestCase


class TestExportControls(TestCase):
  """Test imports for basic control objects."""

  model = all_models.Control

  def setUp(self):
    with factories.single_commit():
      super(TestExportControls, self).setUp()
      self.client.get("/login")
      self.headers = {
          'Content-Type': 'application/json',
          "X-Requested-By": "GGRC",
          "X-export-view": "blocks",
      }
      with factories.single_commit():
        self.basic_owner = factories.PersonFactory(name="basic owner")
        self.control = factories.ControlFactory()
        self.control.add_person_with_role_name(self.basic_owner, "Admin")

  def test_search_by_owner_email(self):
    self.assert_slugs("Admin",
                      self.basic_owner.email,
                      [self.control.slug])

  def test_search_by_owner_name(self):
    self.assert_slugs("Admin",
                      self.basic_owner.name,
                      [self.control.slug])

  def test_search_by_new_owner(self):
    """Filter by added new owner and old owner"""
    basic_email, basic_name = self.basic_owner.email, self.basic_owner.name
    with factories.single_commit():
      new_owner = factories.PersonFactory(name="new owner")
      self.control.add_person_with_role_name(new_owner, "Admin")

    new_owner_email = new_owner.email
    new_owner_name = new_owner.email
    control_slug = self.control.slug

    self.client.post("/admin/full_reindex")

    self.assert_slugs("Admin",
                      new_owner_email,
                      [control_slug])
    self.assert_slugs("Admin",
                      new_owner_name,
                      [control_slug])
    self.assert_slugs("Admin",
                      basic_email,
                      [control_slug])
    self.assert_slugs("Admin",
                      basic_name,
                      [control_slug])

  def test_search_by_deleted_owner(self):
    """Filter by deleted owner"""
    all_models.AccessControlPerson.query.delete()
    db.session.commit()
    self.assert_slugs("owners", self.basic_owner.email, [])
    self.assert_slugs("owners", self.basic_owner.name, [])
