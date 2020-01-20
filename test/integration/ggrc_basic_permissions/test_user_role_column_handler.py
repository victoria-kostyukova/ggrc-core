# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests for UserRoleColumnHandler methods."""

from os.path import abspath
from os.path import dirname
from os.path import join
from ggrc.models import all_models
from ggrc.converters import errors
from integration.ggrc import TestCase


class TestUserRoleColumnHandler(TestCase):
  """ Test for UserRoleColumnHandler class functionality"""

  CSV_DIR = join(abspath(dirname(__file__)), "test_csvs")

  def setUp(self):
    TestCase.setUp(self)
    self.client.get("/login")
    self.admin_role = (all_models.Role.query.filter_by(name="Administrator")
                       .one())
    self.creator_role = (all_models.Role.query.filter_by(name="Creator")
                         .one())
    self.reader_role = (all_models.Role.query.filter_by(name="Reader").one())

  def test_user_role_title(self):
    """ Test for user role handling

    Tests the correctness of handling user role while importing from csv.
    Correct roles pass without errors, for incorrect role error is generated
    for the whole row.
    """
    response_json = self.import_file("import_with_user_role.csv", safe=False)
    expected_errors = {
        errors.WRONG_VALUE.format(line="4", column_name="Role"),
        errors.WRONG_VALUE.format(line="7", column_name="Role"),
        errors.WRONG_VALUE.format(line="8", column_name="Role"),
    }

    self.assertEqual(6, response_json[0]["created"])
    self.assertEqual(3, response_json[0]["ignored"])

    response_errors = response_json[0]["row_errors"]
    self.assertEqual(expected_errors, set(response_errors))

    reader_count = all_models.UserRole.query.filter_by(
        role_id=self.reader_role.id).count()
    self.assertEqual(reader_count, 2)
    creator_count = all_models.UserRole.query.filter_by(
        role_id=self.creator_role.id).count()
    self.assertEqual(creator_count, 1)
    admin_count = all_models.UserRole.query.filter_by(
        role_id=self.admin_role.id).count()
    self.assertEqual(admin_count, 1)
    all_user_roles = all_models.UserRole.query.all()
    users_with_roles = set([user_role.person_id
                            for user_role in all_user_roles])
    users_with_norole_count = all_models.Person.query.filter(
        all_models.Person.id.notin_(users_with_roles)).count()
    self.assertEqual(users_with_norole_count, 3)

    response_json = self.import_file("import_with_noaccess_role.csv",
                                     safe=False)
    self.assertEqual(3, response_json[0]["updated"])
    self.assertEqual([], response_json[0]["row_errors"])

    reader_count = all_models.UserRole.query.filter_by(
        role_id=self.reader_role.id).count()
    self.assertEqual(reader_count, 1)
    creator_count = all_models.UserRole.query.filter_by(
        role_id=self.creator_role.id).count()
    self.assertEqual(creator_count, 0)
    admin_count = all_models.UserRole.query.filter_by(
        role_id=self.admin_role.id).count()
    self.assertEqual(admin_count, 1)
    all_user_roles = all_models.UserRole.query.all()
    users_with_roles = set([user_role.person_id
                            for user_role in all_user_roles])
    users_with_norole_count = all_models.Person.query.filter(
        all_models.Person.id.notin_(users_with_roles)).count()
    self.assertEqual(users_with_norole_count, 5)
