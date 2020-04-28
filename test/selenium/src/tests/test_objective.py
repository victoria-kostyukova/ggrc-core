# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Objectives tests."""
# pylint: disable=no-self-use
# pylint: disable=invalid-name
# pylint: disable=too-few-public-methods

import pytest

from lib import base

from lib.service import rest_facade
from lib.service import webui_service
from lib.service.rest.client import RestClient
from lib.utils import help_utils


class TestObjectivePage(base.Test):
  """Tests of objectives."""

  @pytest.mark.smoke_tests
  @pytest.mark.parametrize(
      ("obj", "is_map_again"),
      [
          ("objective_mapped_to_program", False),
          ("objectives_mapped_to_program", False),
          ("objective_mapped_to_program", True)
      ],
      ids=["Check if Objective can be mapped to Control via REST",
           "Check if Multiple Objectives can be mapped to Control via REST",
           "Check if Objective can't be mapped to Control twice via REST"],
      indirect=["obj"])
  def test_mapping_objectives_to_control_via_rest(
      self, control, obj, is_map_again, selenium
  ):
    """Check if Objectives can be mapped to Control via REST."""
    # pylint: disable=too-many-arguments
    expected_status_code = RestClient.STATUS_CODES["OK"]
    mapping_responses = rest_facade.map_objs(control, obj)
    assert all(expected_status_code == response.status_code
               for response in mapping_responses)
    assert (rest_facade.map_objs(control, obj)[0].status_code ==
            expected_status_code) if is_map_again else True
    actual_objectives_tab_count = (
        webui_service.ObjectivesService(selenium).get_count_objs_from_tab(
            src_obj=control))
    assert (len(help_utils.convert_to_list(obj)) ==
            actual_objectives_tab_count)
