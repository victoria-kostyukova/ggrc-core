# -*- coding: utf-8 -*-

# Copyright (C) 2019 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests for functions in the ggrc.utils module."""

import os
import unittest

import mock
from mock import patch

from ggrc import utils
from ggrc.utils import get_url_root
from ggrc.settings import default


class TestGetUrlRoot(unittest.TestCase):
  """Test suite for the get_url_root() function."""

  # pylint: disable=invalid-name

  def test_using_request_url_when_custom_url_root_setting_undefined(self):
    """Url root should be read from request if not set in environment."""
    with patch("ggrc.utils.CUSTOM_URL_ROOT", None):
      with patch("ggrc.utils.flask.request") as fake_request:
        fake_request.url_root = "http://www.foo.com/"
        result = get_url_root()

    self.assertEqual(result, "http://www.foo.com/")

  def test_using_request_url_when_custom_url_root_setting_empty_string(self):
    """Url root should be read from request if set to empty string in environ.
    """
    with patch("ggrc.utils.CUSTOM_URL_ROOT", ""):
      with patch("ggrc.utils.flask.request") as fake_request:
        fake_request.url_root = "http://www.foo.com/"
        result = get_url_root()

    self.assertEqual(result, "http://www.foo.com/")

  def test_using_custom_url_root_setting_if_defined(self):
    """Url root should be read from environment if defined there."""
    with patch("ggrc.utils.CUSTOM_URL_ROOT", "http://www.default-root.com/"):
      with patch("ggrc.utils.flask.request") as fake_request:
        fake_request.url_root = "http://www.foo.com/"
        result = get_url_root()

    self.assertEqual(result, "http://www.default-root.com/")


class TestSettings(unittest.TestCase):
  """Test loading settings from environment."""

  @patch.dict(os.environ, {})
  def test_default_values(self):
    """Test loading default values variable."""
    reload(default)  # Need to reload for variable reinitialization.
    self.assertEqual(default.COMPANY, "Company, Inc.")
    self.assertEqual(default.COMPANY_LOGO_TEXT, "Company")
    self.assertEqual(default.CREATE_ISSUE_URL, "")
    self.assertEqual(default.CREATE_ISSUE_BUTTON_NAME, "")
    self.assertEqual(default.CREATE_ISSUE_TICKET_LINK, "")
    self.assertEqual(default.CHANGE_REQUEST_URL, "")

  @patch.dict(os.environ, {
      "COMPANY": "TestCompany",
      "COMPANY_LOGO_TEXT": "TestCompanyLogo",
      "CREATE_ISSUE_URL": "TestRMCCreateIssueURL",
      "CREATE_ISSUE_BUTTON_NAME": "TestCreateButtonName",
      "CREATE_ISSUE_TICKET_LINK": "TestCreateTicketLink",
      "CHANGE_REQUEST_URL": "TestChangeRequestURL",
  })
  def test_loading_vars_from_env(self):
    """Test loading settings variables from environment."""
    reload(default)  # Need to reload for variable reinitialization.
    self.assertEqual(default.COMPANY, "TestCompany")
    self.assertEqual(default.COMPANY_LOGO_TEXT, "TestCompanyLogo")
    self.assertEqual(default.CREATE_ISSUE_URL, "TestRMCCreateIssueURL")
    self.assertEqual(default.CREATE_ISSUE_BUTTON_NAME, "TestCreateButtonName")
    self.assertEqual(default.CREATE_ISSUE_TICKET_LINK, "TestCreateTicketLink")
    self.assertEqual(default.CHANGE_REQUEST_URL, "TestChangeRequestURL")


@mock.patch("ggrc.utils.flask")
class TestValidateMimetype(unittest.TestCase):
  """Test mimetype validation decorator."""

  SUCCESS = "Successfully called"
  VALID_MIMETYPE = "my-custom-mimetype"

  @utils.validate_mimetype(VALID_MIMETYPE)
  def decorated_target(self):
    """Dummy response builder."""
    # utils.flask should be mocked already
    return utils.flask.current_app.make_response(
        (self.SUCCESS, 200, []),
    )

  def test_validate_mimetype_valid(self, flask_mock):
    """Mimetype validator calls the decorated function if mimetype matches."""
    flask_mock.request.mimetype = self.VALID_MIMETYPE

    response = self.decorated_target()

    flask_mock.current_app.make_response.assert_called_once_with(
        (self.SUCCESS, 200, []),
    )
    self.assertIs(response, flask_mock.current_app.make_response.return_value)

  def test_validate_mimetype_empty(self, flask_mock):
    """Mimetype validator returns HTTP415 if mimetype is not set."""
    flask_mock.request.mimetype = None

    response = self.decorated_target()

    flask_mock.current_app.make_response.assert_called_once_with(
        ("Content-Type must be {}".format(self.VALID_MIMETYPE), 415, []),
    )
    self.assertIs(response, flask_mock.current_app.make_response.return_value)

  def test_validate_mimetype_invalid(self, flask_mock):
    """Mimetype validator returns HTTP415 if mimetype doesn't match."""
    flask_mock.request.mimetype = "invalid"

    response = self.decorated_target()

    flask_mock.current_app.make_response.assert_called_once_with(
        ("Content-Type must be {}".format(self.VALID_MIMETYPE), 415, []),
    )
    self.assertIs(response, flask_mock.current_app.make_response.return_value)
