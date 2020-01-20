# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Integration tests for synchronizable.ProtectedAttributes mixin."""

import ddt

from integration.ggrc import api_helper
from integration.ggrc import TestCase
from integration.ggrc.models import factories


@ddt.ddt
class TestProtectedAttributes(TestCase):
  """ProtectedAttributes test cases"""

  @ddt.data(
      'Control',
      'Issue',
      'AccessGroup',
      'Contract',
      'DataAsset',
      'Facility',
      'Market',
      'Metric',
      'Objective',
      'OrgGroup',
      'Policy',
      'Process',
      'Product',
      'ProductGroup',
      'Program',
      'Project',
      'Regulation',
      'Requirement',
      'Risk',
      'Standard',
      'System',
      'TechnologyEnvironment',
      'Threat',
      'Vendor',
  )
  # pylint: disable=no-self-use
  def test_update_protected_attribute(self, factory_name):
    """Test update of protected attribute."""
    api = api_helper.Api()
    api.login_as_external()

    with factories.single_commit():
      factory = factories.get_model_factory(factory_name)
      instance = factory(folder="correct_folder")
      instance_class = instance.__class__

    response = api.put(instance, {"folder": "new_folder"})
    self.assert200(response)

    instance = instance_class.query.get(instance.id)
    self.assertEqual("correct_folder", instance.folder)
