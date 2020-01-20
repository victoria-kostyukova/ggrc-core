# -*- coding: utf-8 -*-
# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test Access Control Role validation"""

import unittest
from collections import namedtuple
import ddt
from mock import MagicMock

import ggrc.app  # noqa pylint: disable=unused-import
from ggrc.models import all_models
from ggrc.models.hooks.access_control_role import handle_role_acls


@ddt.ddt
class TestAccessControlRoles(unittest.TestCase):
  """Test Access Control Role validation"""

  def setUp(self):
    # pylint: disable=protected-access
    self.acr = all_models.AccessControlRole()
    self.acr._get_reserved_names = MagicMock(return_value=frozenset({'title'}))
    self.acr._get_global_cad_names = MagicMock(
        return_value={'reg url': 1})

  def test_simple_validation(self):
    """Test if access control role validation sets the fields correctly"""
    name, object_type = "New Object name", "Control"
    self.acr.name = name
    self.acr.object_type = object_type
    assert self.acr.name == name, \
        "Access control name not properly set {} != {}".format(
            self.acr.name, name)
    assert self.acr.object_type == object_type, \
        "Access control object type not properly set {} != {}".format(
            self.acr.object_type, object_type)

  def test_invalid_name_throws(self):
    """Test if raises on collision with global attributes"""

    with self.assertRaises(ValueError):
      name, object_type = "title", "Control"
      self.acr.name = name
      self.acr.object_type = object_type

  def test_camelcase_name_throws(self):
    """Test if raises on collision with global attributes"""

    with self.assertRaises(ValueError):
      name, object_type = "TiTle", "Control"
      self.acr.name = name
      self.acr.object_type = object_type

  @ddt.data("role title with asterisk*",
            "map:object",
            "unmap:object",
            "delete",
            "  map:  Market  ",
            "UNmAP:  CONTROL ",
            "DeLeTe",
            )
  def test_name_with_asterisk_throws(self, name):
    """Test if raises if name contains * symbol"""
    with self.assertRaises(ValueError):
      self.acr.validates_name("name", name)

  def test_if_invalid_ca_check(self):
    """Test if raises on collision with custom attributes attributes"""
    with self.assertRaises(ValueError):
      name, object_type = "reg url", "Regulation"
      self.acr.name = name
      self.acr.object_type = object_type

  def test_if_camelcase_ca_check(self):
    """Test if raises on collision with custom attributes attributes"""
    with self.assertRaises(ValueError):
      name, object_type = "Reg Url", "Regulation"
      self.acr.name = name
      self.acr.object_type = object_type


class TestAccessControlRolesHooks(unittest.TestCase):
  """Test access control role creation hooks"""

  def setUp(self):
    self.acr = namedtuple("AccessControlRole", ["name", "object_type"])(
        u"兄貴", "Fake Object Type"
    )

  def test_support_of_non_ascii_name(self):
    """Check if handle_role_acls supports non ascii names"""
    try:
      handle_role_acls(self.acr)
    except UnicodeEncodeError as unicode_encode_error:
      self.fail(unicode_encode_error)
