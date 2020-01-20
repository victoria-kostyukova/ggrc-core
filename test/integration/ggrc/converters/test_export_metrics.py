# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests metrics export."""

from integration.ggrc import TestCase
from integration.ggrc.models import factories


class TestMetricsExport(TestCase):
  """Tests metrics export."""
  def setUp(self):
    super(TestMetricsExport, self).setUp()
    self.client.get('/login')

  def test_metrics_export(self):
    """Test for metrics export."""
    titles = {"title 1", "title 2", "title 3"}

    with factories.single_commit():
      for title in titles:
        factories.MetricFactory(
            title=title
        )

    data = [{
        "object_name": "Metric",
        "filters": {
            "expression": {}
        },
        "fields": "all"
    }]
    exported_metrics = self.export_parsed_csv(data)["Metric"]
    self.assertEqual(titles, {metric["Title*"] for metric in exported_metrics})
