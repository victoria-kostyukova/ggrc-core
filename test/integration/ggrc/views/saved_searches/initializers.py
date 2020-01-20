# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
  Helper module for saved_search related tests.
  Helps setup testing environment.
"""

import json

from ggrc.rbac import SystemWideRoles
from ggrc_basic_permissions.models import Role, UserRole


def setup_user_role(user):
  """
    Setup Administrator role for test user.
  """
  role = Role.query.filter(
      Role.name == SystemWideRoles.ADMINISTRATOR,
  ).first()

  user_role = UserRole()
  user_role.role = role
  user_role.person = user

  return user_role


def get_client_and_headers(app, user):
  """
    Get request headers and test client instance.
  """

  client = app.test_client()

  headers = {
      "Content-Type": "application/json",
      "X-Requested-By": "GGRC",
      "X-ggrc-user": json.dumps({
          "name": user.name,
          "email": user.email,
      })
  }

  return client, headers
