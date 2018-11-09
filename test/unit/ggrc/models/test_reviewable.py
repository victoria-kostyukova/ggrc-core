# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

""" Unit tests for the Reviewable object """

import unittest

import mock

from ggrc.models import review


class TestReviewableMixin(unittest.TestCase):
  """Unit tests for Reviewable mixin."""

  @mock.patch("ggrc.notifications.add_notification")
  def test_handle_proposal_ignorable(self, mock_add_notification):
    """Test that chages of ignorable attrs does not change review state."""
    reviewable = review.Reviewable()

    attribute_changes = [mock.Mock(key=attr,
                                   history=mock.Mock(has_changes=lambda: True))
                         for attr in reviewable.ATTRS_TO_IGNORE]
    with mock.patch("ggrc.db.inspect",
                    return_value=mock.Mock(attrs=attribute_changes)):

      mocked_review = mock.Mock(status=review.Review.STATES.REVIEWED)
      with mock.patch("ggrc.models.review.Reviewable.review",
                      return_value=mocked_review):
        reviewable.handle_proposal_applied()
        self.assertEqual(mocked_review.status, review.Review.STATES.REVIEWED)
    self.assertFalse(mock_add_notification.called)
