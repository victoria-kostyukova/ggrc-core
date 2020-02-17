# Copyright (C) 2020 Google Inc.

# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Unittests for Workflow Custom Restriction"""

import unittest
import ddt
from ggrc_workflows.models.mixins import WFCustomRestrictions


@ddt.ddt
class TestWFCustomRestrictions(unittest.TestCase):
  """Tests for an object custom restriction for workflow objects ."""

  __test_method = "PUT"

  def setUp(self):
    self.wf_custom_restriction = WFCustomRestrictions()

  @ddt.data(
      (
          {"test_field": "1"},
          {"test_field": "2"},
          True,
          ["test_field"]
      ),
      (
          {"test_field": "2"},
          {"test_field": "2"},
          False,
          ["test_field"]
      ),
      (
          {},
          {},
          False,
          ["test_field"]
      ),
      (
          {},
          {},
          True,
          []
      ),
  )
  @ddt.unpack
  def test_task_methods_field(self,
                              obj,
                              upd_obj,
                              result,
                              fields_cnf):
    """Unitest method checks for different field values which is restricted"""
    self.wf_custom_restriction.method_fields_restrictions = {
        self.__test_method: fields_cnf
    }

    is_restricted = self.wf_custom_restriction.is_method_fields_restricted(
        self.__test_method,
        obj,
        upd_obj
    )

    self.assertEqual(is_restricted, result)
