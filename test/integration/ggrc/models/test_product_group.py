# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests ProductGroup export."""

from integration.ggrc import TestCase
from integration.ggrc.models import factories


class TestProductGroupExport(TestCase):
  """Tests ProductGroup export."""
  def setUp(self):
    super(TestProductGroupExport, self).setUp()
    self.client.get('/login')

  def test_product_group_export(self):
    """Test for ProductGroup export."""
    titles = {"title 1", "title 2", "title 3"}

    with factories.single_commit():
      for title in titles:
        factories.ProductGroupFactory(
            title=title
        )

    data = [{
        "object_name": "ProductGroup",
        "filters": {
            "expression": {}
        },
        "fields": "all"
    }]
    exported_groups = self.export_parsed_csv(data)["Product Group"]
    self.assertEqual(titles, {
        group["Title*"] for group in exported_groups
    })
