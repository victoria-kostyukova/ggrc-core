# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Provides access to the current Selenium driver / Nerodia browser."""
import nerodia

_browser = None  # pylint: disable=invalid-name
_driver = None  # pylint: disable=invalid-name


def get_browser():
  """Returns current browser."""
  return _browser


def get_driver():
  """Returns current driver."""
  return _driver


def set_driver(driver):
  """Sets driver and browser."""
  # pylint: disable=invalid-name, global-statement
  global _driver, _browser
  _driver = driver
  if driver:
    _browser = nerodia.browser.Browser(browser=driver)
  else:
    _browser = None
