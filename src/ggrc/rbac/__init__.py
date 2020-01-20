# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Basic permissions module."""


class SystemWideRoles(object):
  """List of system wide roles."""
  # pylint: disable=too-few-public-methods

  SUPERUSER = u"Superuser"
  ADMINISTRATOR = u"Administrator"
  EDITOR = u"Editor"
  READER = u"Reader"
  CREATOR = u"Creator"
  NO_ACCESS = u"No Access"

  admins = {
      SUPERUSER,
      ADMINISTRATOR
  }

  read_roles = {
      SUPERUSER,
      ADMINISTRATOR,
      EDITOR,
      READER,
  }

  update_roles = {
      SUPERUSER,
      ADMINISTRATOR,
      EDITOR,
  }
