# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Integration tests for Documentable"""
import ddt
from mock import mock

from integration.ggrc import TestCase
from integration.ggrc.models import factories


@ddt.ddt
class TestPublicDocumentable(TestCase):
  """PublicDocumentable test cases"""

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
  def test_add_file_to_gdrive_folder(self, factory_name):
    """Test add document file to {0:22}gdrive folder"""
    mock_path = "ggrc.gdrive.file_actions.add_gdrive_file_folder"
    with mock.patch(mock_path) as g_drive:
      g_drive.return_value = "magic_response"
      with factories.single_commit():
        factory = factories.get_model_factory(factory_name)
        instance = factory(folder="correct_folder")
        factories.DocumentFileFactory(
            source_gdrive_id="correct_file",
            parent_obj={
                "id": instance.id,
                "type": instance.type,
            }
        )
    g_drive.assert_called_with("correct_file", "correct_folder")
