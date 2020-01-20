# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""AccessControlRole API resource extension."""
# pylint: disable=cyclic-import

from ggrc.services import common


ROLE_PERMISSIONS = ("delete", "update", "read")


class AccessControlRoleResource(common.Resource):
  """Resource handler for access controle role."""

  # pylint: disable=abstract-method

  def _check_post_create_options(self, body):
    """Pretreat POST params."""
    for item in body:
      access_control_role_options = item.get('access_control_role', {})
      if all(role in access_control_role_options for role in ROLE_PERMISSIONS):
        if (
            (
                access_control_role_options['delete'] or
                access_control_role_options['update']
            ) and not
            access_control_role_options['read']
        ):
          raise ValueError(u"User can't create role with permissions: "
                           u"delete or edit and no read")
