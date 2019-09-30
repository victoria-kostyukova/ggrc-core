# Copyright (C) 2019 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Defines common methods for Mapping and Unmapping"""

import collections
import mock

from ggrc import utils
from integration.ggrc import TestCase
from integration.ggrc import factories


class BaseTestImportMapUnmap(TestCase):
  """Defines common methods"""

  @staticmethod
  def _get_import_data(model1, model2, unmap):
    """Returns data for csv import of the respective objects"""
    name1 = model1.__name__
    name2 = model2.__name__
    title1 = utils.title_from_camelcase(name1)

    with factories.single_commit():
      with mock.patch('ggrc.models.relationship.is_external_app_user',
                      return_value=True):
        obj1 = factories.get_model_factory(name1)()
        obj2 = factories.get_model_factory(name2)()
        if unmap:
          factories.RelationshipFactory(source=obj1, destination=obj2,
                                        is_external=True)
        slug1 = obj1.slug
        slug2 = obj2.slug

    data_block = [
        collections.OrderedDict([
            ("object_type", name1),
            ("Code*", slug1),
        ]),
        collections.OrderedDict([
            ("object_type", name2),
            ("Code*", slug2),
            ("{}:{}".format("unmap" if unmap else "map", title1), slug1),
        ]),
    ]
    return data_block

  def _get_import_csv_response(self, model1, model2, unmap=True):
    """Returns import csv response of the respective objects"""
    data_block = self._get_import_data(model1, model2, unmap)
    return self.import_data(*data_block)
