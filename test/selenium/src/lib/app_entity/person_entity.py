# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""App entities related to person."""
import attr

from lib.app_entity import _base


@attr.s
class Person(_base.Base):
  """Represents Person entity."""
  name = attr.ib()
  email = attr.ib()
  global_role_name = attr.ib()


@attr.s
class GlobalRole(_base.Base):
  """Represents global Role entity in the app."""
  name = attr.ib()


@attr.s
class UserRole(_base.Base):
  """Represents a UserRole entity in the app.
  (UserRole is a mapping between person and global role).
  """
  person = attr.ib()
  role = attr.ib()
