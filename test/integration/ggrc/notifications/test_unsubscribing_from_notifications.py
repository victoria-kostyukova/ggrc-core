# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests for the daily digest unsubscribe API endpoint."""

from ggrc import db
from ggrc.models import all_models
from ggrc.notifications.unsubscribe import unsubscribe_url

from integration.ggrc import TestCase
from integration.ggrc.api_helper import Api


# pylint: disable=invalid-name
class TestUnsubscribeFromNotifications(TestCase):
  """Tests unsubscribing from notifications."""

  def setUp(self):
    super(TestUnsubscribeFromNotifications, self).setUp()
    self.api = Api()
    self.client.get("/login")

  def test_unsubscribing_not_publicly_allowed(self):
    """Anonymous users should not be allowed to unsubscribe anyone."""
    self.client.get("/logout")
    person = all_models.Person.query.first()
    url = unsubscribe_url(person.id)
    response = self.client.get(url)
    self.assertEqual(response.status_code, 302)

  def test_does_not_allow_unsubscribing_other_users(self):
    """Unsubscribing users other than self should results in HTTP 403."""
    person = all_models.Person.query.first()

    url = unsubscribe_url(person.id + 123)
    response = self.client.get(url)

    self.assertEqual(response.status_code, 403)

  def test_unsubscribing_when_explicitly_subscribed(self):
    """Test that users can unsubscribe themselves.

    NOTE: Explicitly subscribed means that there exists a relevant notification
    config entry in database.
    """
    person = all_models.Person.query.first()

    config = all_models.NotificationConfig(
        person_id=person.id,
        notif_type="Email_Digest",
        enable_flag=True
    )
    db.session.add(config)
    db.session.flush()

    url = unsubscribe_url(person.id)
    response = self.client.get(url)
    self.assert200(response)

    config = all_models.NotificationConfig.query.filter_by(
        person_id=person.id, notif_type="Email_Digest"
    ).first()
    self.assertIsNotNone(config)
    self.assertFalse(config.enable_flag)

  def test_unsubscribing_when_subscribed_by_default(self):
    """Test that users can unsubscribe themselves when no DB entry.

    By default, users are subscribed to daily digest emails even if there is no
    notification config entry in database, but unsubscribing such users must
    work, too.
    """
    person = all_models.Person.query.first()
    url = unsubscribe_url(person.id)
    response = self.client.get(url)
    self.assert200(response)

    person = all_models.Person.query.first()
    config = all_models.NotificationConfig.query.filter_by(
        person_id=person.id, notif_type="Email_Digest"
    ).first()
    self.assertIsNotNone(config)
    self.assertFalse(config.enable_flag)

  def test_unsubscribing_when_already_unsubscribed(self):
    """Test that unsubscribing oneself when unsubscribed yields no error."""
    person = all_models.Person.query.first()
    config = all_models.NotificationConfig(
        person_id=person.id,
        notif_type="Email_Digest",
        enable_flag=False
    )
    db.session.add(config)
    db.session.flush()
    url = unsubscribe_url(person.id)
    response = self.client.get(url)
    self.assert200(response)

    config = all_models.NotificationConfig.query.filter_by(
        person_id=person.id, notif_type="Email_Digest"
    ).first()
    self.assertIsNotNone(config)
    self.assertFalse(config.enable_flag)
