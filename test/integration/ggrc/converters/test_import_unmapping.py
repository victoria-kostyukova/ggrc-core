# Copyright (C) 2019 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests mapping and unmappings via import"""

import ddt

from ggrc import utils

from ggrc.models import all_models
from ggrc.converters import errors
from integration import ggrc
from integration.ggrc.converters import BaseTestImportMapUnmap


@ddt.ddt
class TestUnmappings(BaseTestImportMapUnmap):
  """Tests unmappings via import"""

  def setUp(self):
    super(TestUnmappings, self).setUp()
    self.client.get("/login")

  @ddt.data(*ggrc.MAPPING_SCOPE_PAIRS)
  @ddt.unpack
  def test_unmap_scope_objects(self, model1, model2):
    """Test deprecated unmapping between {0.__name__} and {1.__name__}
    """
    response = self._get_import_csv_response(model1, model2)
    obj1 = model1.__name__
    obj2 = utils.title_from_camelcase(model2.__name__).title()

    # Check that unmapping is not done
    self._check_csv_response([response[1]], {
        obj2: {
            "row_warnings": {
                errors.MAP_UNMAP_SCOPE_ERROR.format(
                    line=7,
                    object_type=obj1,
                ),
            },
        },
    })

  @ddt.data(*ggrc.MAPPING_REGULATION_PAIRS)
  @ddt.unpack
  def test_unmap_regulation_objects(self, model1, model2):
    """Test deprecated unmapping between {0.__name__} and {1.__name__}
    """
    response = self._get_import_csv_response(model1, model2)
    obj1 = model1.__name__
    obj2 = utils.title_from_camelcase(model2.__name__).title()

    # Check that unmapping is not done
    self._check_csv_response([response[1]], {
        obj2: {
            "row_warnings": {
                errors.MAP_UNMAP_REGULATION_ERROR.format(
                    line=7,
                    object_type=obj1,
                ),
            },
        },
    })

  @ddt.data(*ggrc.MAPPING_STANDARD_PAIRS)
  @ddt.unpack
  def test_unmap_standard_objects(self, model1, model2):
    """Test deprecated unmapping between {0.__name__} and {1.__name__}
    """
    response = self._get_import_csv_response(model1, model2)
    obj1 = model1.__name__
    obj2 = utils.title_from_camelcase(model2.__name__).title()

    # Check that unmapping is not done
    self._check_csv_response([response[1]], {
        obj2: {
            "row_warnings": {
                errors.MAP_UNMAP_STANDARD_ERROR.format(
                    line=7,
                    object_type=obj1,
                ),
            },
        },
    })

  @ddt.data(
      *all_models.get_scope_models()
  )
  def test_unmap_policy_objects(self, scoping_model):
    """Test unmapping between {0.__name__} and Policy."""
    response = self._get_import_csv_response(scoping_model, all_models.Policy)
    self._check_csv_response(response, {})
