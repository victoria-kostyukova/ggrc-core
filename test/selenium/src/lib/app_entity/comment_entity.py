# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""App entities related to comment."""
import attr

from lib.app_entity import _base


@attr.s
class Comment(_base.Base):
  """Represents Comment entity."""
  description = attr.ib()
