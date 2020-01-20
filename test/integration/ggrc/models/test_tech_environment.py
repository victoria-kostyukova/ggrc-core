# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests Technology Environment export."""

from integration.ggrc import TestCase
from integration.ggrc.models import factories


class TestTechnologyEnvironmentExport(TestCase):
  """Tests Technology Environment export."""
  def setUp(self):
    super(TestTechnologyEnvironmentExport, self).setUp()
    self.client.get('/login')

  def test_tech_environment_export(self):
    """Test for Technology Environment export."""
    titles = {"title 1", "title 2", "title 3"}

    with factories.single_commit():
      for title in titles:
        factories.TechnologyEnvironmentFactory(
            title=title
        )

    data = [{
        "object_name": "TechnologyEnvironment",
        "filters": {
            "expression": {}
        },
        "fields": "all"
    }]
    exported_tech_envs = self.export_parsed_csv(data)["Technology Environment"]
    self.assertEqual(titles,
                     {tech_env["Title*"] for tech_env in exported_tech_envs})
