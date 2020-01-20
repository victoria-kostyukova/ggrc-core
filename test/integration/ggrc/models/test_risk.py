# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests for Risk model."""
from ggrc.models import all_models
from integration.ggrc import TestCase, api_helper
from integration.ggrc.models import factories
from integration.ggrc.query_helper import WithQueryApi


class TestRiskGGRC(TestCase):
  """Tests for risk model for GGRC users."""

  def setUp(self):
    """setUp, nothing else to add."""
    super(TestRiskGGRC, self).setUp()
    self.api = api_helper.Api()

  def test_create_risk(self):
    """Test risk create with internal user."""
    response = self.api.post(all_models.Risk, {"title": "new-title"})

    self.assert403(response)
    risk_count = all_models.Risk.query.filter(
        all_models.Risk.title == "new-title").count()
    self.assertEqual(0, risk_count)

  def test_update_risk(self):
    """Test risk update with internal user."""
    risk = factories.RiskFactory()
    old_title = risk.title

    response = self.api.put(risk, {"title": "new-title"})

    self.assert403(response)
    risk = all_models.Risk.query.get(risk.id)
    self.assertEqual(old_title, risk.title)

  def test_delete_risk(self):
    """Test risk delete with internal user."""
    risk = factories.RiskFactory()

    response = self.api.delete(risk)

    self.assert403(response)
    risk = all_models.Risk.query.get(risk.id)
    self.assertIsNotNone(risk.title)


class TestRiskQueryApi(WithQueryApi, TestCase):
  """Tests for query Api."""

  # pylint: disable=invalid-name
  def setUp(self):
    super(TestRiskQueryApi, self).setUp()
    self.client.get("/login")
    self.api = api_helper.Api()

  def test_review_status_search(self):
    """Review status search.

    The query should take data form review_status_display_name field
    """
    risk_id = factories.RiskFactory(
        review_status_display_name="Review Needed"
    ).id
    risk_by_review_status = self.simple_query(
        "Risk",
        expression=["Review Status", "=", "Review Needed"]
    )

    self.assertEquals(1, len(risk_by_review_status))
    self.assertEquals(risk_id, risk_by_review_status[0]["id"])
