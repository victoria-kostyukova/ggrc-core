# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Integration tests for Event page."""

from integration.ggrc import TestCase
from integration.ggrc.models import factories


class TestEvent(TestCase):
  """Test event page functionality."""

  # pylint: disable=invalid-name

  def setUp(self):
    super(TestEvent, self).setUp()
    self.client.get("/login")

  def test_events_collection(self):
    """Simple test for events endpoint."""
    factories.ControlFactory()  # event with some revisions is generated
    response = self.client.get(
        "/api/events?__include=revisions&__page=1&__page_size=20"
    )
    self.assertEqual(response.status_code, 200)
