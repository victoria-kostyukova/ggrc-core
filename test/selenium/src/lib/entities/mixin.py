# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Mixins for entities."""
# pylint: disable=too-few-public-methods


class Reviewable(object):
  """A mixin for reviewable objects."""

  def update_review(self, new_review):
    """Update obj review dict and status with new values."""
    new_review = new_review.convert_review_to_dict()
    self.review["status"] = new_review["status"]
    if new_review["last_reviewed_by"]:
      self.review["last_reviewed_by"] = new_review["last_reviewed_by"]
    self._upd_reviewers(new_review["reviewers"])
    self.update_attrs(review_status=new_review["status"])

  def _upd_reviewers(self, new_reviewers):
    """Update object review `reviewers` with new values if needed."""
    if self.review["reviewers"]:
      if new_reviewers and new_reviewers[0] not in self.review["reviewers"]:
        self.review["reviewers"] = self.review["reviewers"] + new_reviewers
    else:
      self.review["reviewers"] = new_reviewers
