# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Threats page smoke tests."""
# pylint: disable=no-self-use
# pylint: disable=too-few-public-methods
# pylint: disable=unused-argument

import pytest

from lib import base
from lib.app_entity_factory import threat_entity_factory
from lib.ui import threat_ui_facade, ui_facade
from lib.utils import test_utils


class TestThreatPage(base.Test):
  """Tests threat page, part of smoke tests."""

  @pytest.fixture()
  def threat(self):
    """Create workflow via UI."""
    threat = threat_entity_factory.ThreatFactory().create()
    threat_ui_facade.create_threat(threat)
    return threat

  @pytest.mark.smoke_tests
  def test_create_threat(self, selenium, threat):
    """Tests threat creation via UI."""
    actual_treat = ui_facade.get_obj(threat)
    test_utils.set_unknown_attrs_to_none(actual_treat)
    test_utils.obj_assert(actual_treat, threat)
