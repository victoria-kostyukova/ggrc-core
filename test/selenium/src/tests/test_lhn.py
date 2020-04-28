# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Tests for LHN."""
# pylint: disable=no-self-use
import pytest

from lib import base, url
from lib.page import dashboard
from lib.service import rest_facade
from lib.utils import selenium_utils


class TestLhn(base.Test):
  """Tests for Left Hand Nav."""

  @pytest.mark.smoke_tests
  def test_destructive_obj_count(self, selenium):
    """Checks if count updates in LHN after creating new program."""
    selenium_utils.open_url(url.Urls().dashboard)
    count_before = dashboard.Header(selenium).open_lhn_menu(
    ).select_my_objects().toggle_programs.members_count
    rest_facade.create_program()
    selenium.refresh()
    count_after = dashboard.Header(selenium).open_lhn_menu(
    ).select_my_objects().toggle_programs.members_count
    assert count_after == count_before + 1
