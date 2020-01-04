# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Base test case for testing snapshotter"""

from collections import defaultdict
from os.path import abspath, dirname, join

import ggrc.models as models
from ggrc.models.mixins.synchronizable import Synchronizable

from integration.ggrc import api_helper
from integration.ggrc import TestCase
import integration.ggrc.generator
from integration.ggrc.models import factories


THIS_ABS_PATH = abspath(dirname(__file__))
CSV_DIR = join(THIS_ABS_PATH, "../converters/test_csvs/")


def snapshot_identity(s_1, s_2):
  return (s_1.id == s_2.id and
          s_1.updated_at == s_2.updated_at and
          s_1.child_id == s_2.child_id and
          s_1.child_type == s_2.child_type and
          s_1.revision_id == s_2.revision_id)


class SnapshotterBaseTestCase(TestCase):
  """Test cases for Snapshoter module"""

  # pylint: disable=invalid-name

  def setUp(self):
    super(SnapshotterBaseTestCase, self).setUp()
    self.objgen = integration.ggrc.generator.ObjectGenerator()
    self.api = api_helper.Api()

  def create_object(self, cls, data):
    """Generate object with provided data."""
    if issubclass(cls, Synchronizable):
      with self.objgen.api.as_external():
        _, obj = self.objgen.generate_object(cls, data)
    else:
      _, obj = self.objgen.generate_object(cls, data)

    return obj

  def create_mapping(self, src, dst):
    _, obj = self.objgen.generate_relationship(src, dst)
    return obj

  def create_audit(self, program, title=None):
    return self.create_object(models.Audit, {
        "title": "Snapshotable audit" if title is None else title,
        "program": {"id": program.id},
        "status": "Planned",
        "snapshots": {
            "operation": "create",
        }
    })

  @staticmethod
  def create_custom_attribute_definitions(cad_definitions=None):
    """Create custom attribute definitions used throughout snapshotter tests"""
    custom_attribute_definitions = defaultdict(list)

    if not cad_definitions:
      cad_definitions = [
          {
              "definition_type": "objective",
              "title": "objective rich field 1",
              "attribute_type": "Rich Text",
          },
      ]

    for cad in cad_definitions:
      attr = factories.CustomAttributeDefinitionFactory(**cad)
      custom_attribute_definitions[cad["definition_type"]] = attr

    return custom_attribute_definitions
