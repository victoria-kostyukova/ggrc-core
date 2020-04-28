# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""App entities related to control."""
import attr

from lib.app_entity import _base


@attr.s
class Control(_base.Base, _base.WithTitleAndCode):
  """Represents Control entity."""
  admins = attr.ib()
  assertions = attr.ib()
  comments = attr.ib()
  review_status = attr.ib()
  review_status_display_name = attr.ib()
  external_id = attr.ib()
  external_slug = attr.ib()
