# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Helpers for review tests"""
from ggrc.models import all_models


def build_reviewer_acl(acr_id=None, user_id=None):
  """Build reviewer acl list from passed values of create new user"""
  if not acr_id:
    acr_id = all_models.AccessControlRole.query.filter_by(
        name="Reviewer", object_type="Review"
    ).one().id

  if not user_id:
    user_id = all_models.Person.query.filter_by(
        email="user@example.com"
    ).one().id

  return [{
      "ac_role_id": acr_id,
      "person": {
          "id": user_id
      },
  }]
