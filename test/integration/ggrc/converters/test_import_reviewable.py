# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests import reviewable."""
from collections import OrderedDict
from ggrc.models import all_models
from integration.ggrc import TestCase
from integration.ggrc import generator
from integration.ggrc.models import factories
from integration.ggrc.review import build_reviewer_acl


class TestImportReviewable(TestCase):
  """Reviewable import tests."""

  def setUp(self):
    """Set up for Reviewable test cases."""
    super(TestImportReviewable, self).setUp()
    self.generator = generator.ObjectGenerator()
    self.client.get("/login")

  def test_simple_import(self):
    """Disallow user to change review state"""
    control = factories.ControlFactory(title="Test control")

    resp, _ = self.generator.generate_object(
        all_models.Review,
        {
            "reviewable": {
                "type": control.type,
                "id": control.id,
            },
            "context": None,
            "notification_type":
            all_models.Review.NotificationTypes.EMAIL_TYPE,
            "status": all_models.Review.STATES.UNREVIEWED,
            "access_control_list": build_reviewer_acl(),
        },
    )
    control_id = control.id
    self.assertEqual(201, resp.status_code)
    import_data = OrderedDict(
        [
            ("object_type", "Control"),
            ("Code*", control.slug),
            ("Review State", "REVIEWED"),
        ]
    )
    response = self.import_data(import_data)
    self._check_csv_response(response, {})

    control = all_models.Control.query.get(control_id)
    self.assertEqual(
        all_models.Review.STATES.UNREVIEWED, control.review_status
    )

  def test_change_attribute(self):
    """Reviewable changed via import
    Review -> UNREVIEWED
    Email Notification added
    """

    control = factories.ControlFactory(title="Test control")

    resp, review = self.generator.generate_object(
        all_models.Review,
        {
            "reviewable": {
                "type": control.type,
                "id": control.id,
            },
            "context": None,
            "notification_type":
            all_models.Review.NotificationTypes.EMAIL_TYPE,
            "status": all_models.Review.STATES.REVIEWED,
            "access_control_list": build_reviewer_acl(),
        },
    )
    control_id = control.id
    self.assertEqual(201, resp.status_code)
    import_data = OrderedDict(
        [
            ("object_type", "Control"),
            ("Code*", control.slug),
            ("Title*", "Brand new TiTle"),
            ("Admin*", "user@example.com"),
            ("Assertions", "Privacy"),
        ]
    )
    response = self.import_data(import_data)
    self._check_csv_response(response, {})
    control = all_models.Control.query.get(control_id)
    self.assertEqual(
        all_models.Review.STATES.UNREVIEWED, control.review_status
    )
    notification = all_models.Notification.query.filter_by(
        object_id=review.id, object_type="Review"
    ).one()
    self.assertTrue(notification)

  def test_mapping(self):
    """Reviewable mapped to snapshotable via import
    Review -> UNREVIEWED
    Email Notification added
    """

    control = factories.ControlFactory(title="Test control")
    issue = factories.IssueFactory()
    issue_slug = issue.slug
    resp, review = self.generator.generate_object(
        all_models.Review,
        {
            "reviewable": {
                "type": control.type,
                "id": control.id,
            },
            "context": None,
            "notification_type":
            all_models.Review.NotificationTypes.EMAIL_TYPE,
            "status": all_models.Review.STATES.REVIEWED,
            "access_control_list": build_reviewer_acl(),
        },
    )
    control_id = control.id
    self.assertEqual(201, resp.status_code)
    import_data = OrderedDict(
        [
            ("object_type", "Control"),
            ("Code*", control.slug),
            ("map:Issue", issue_slug),
        ]
    )
    response = self.import_data(import_data)
    self._check_csv_response(response, {})
    control = all_models.Control.query.get(control_id)
    self.assertEqual(
        all_models.Review.STATES.UNREVIEWED, control.review_status
    )
    notification = all_models.Notification.query.filter_by(
        object_id=review.id, object_type="Review"
    ).one()
    self.assertTrue(notification)
