# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Unit test suite for utils user_generator."""

import unittest
import mock

from ggrc.utils import user_generator


class TestUserGenerator(unittest.TestCase):
  """Unittests for user generator module."""
  # pylint: disable=invalid-name; test method names are too long for pylint

  @mock.patch('ggrc.settings.EXTERNAL_APP_USER', None)
  def test_is_external_app_user_email_no_setting(self):
    """No EXTERNAL_APP_USER presented in settings."""
    self.assertFalse(
        user_generator.is_app_2_app_user_email('test@example.com'))

  @mock.patch('ggrc.settings.EXTERNAL_APP_USER', 'some corrupted email')
  def test_is_external_app_user_email_corrupted_email(self):
    """In EXTERNAL_APP_USER is corrupted email."""
    self.assertFalse(
        user_generator.is_app_2_app_user_email('test@example.com'))

  @mock.patch('ggrc.settings.EXTERNAL_APP_USER', 'Ext App <test2@example.com>')
  def test_is_external_app_user_email_not_equals(self):
    """EXTERNAL_APP_USER email is not equals to given email."""
    self.assertFalse(
        user_generator.is_app_2_app_user_email('test@example.com'))

  @mock.patch('ggrc.settings.EXTERNAL_APP_USER', 'Ext App <test@example.com>')
  def test_is_external_app_user_email_equals(self):
    """EXTERNAL_APP_USER email is equals to given email."""
    self.assertTrue(
        user_generator.is_app_2_app_user_email('test@example.com'))
