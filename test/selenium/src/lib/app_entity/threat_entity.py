# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Threat app entities."""
import attr

from lib.app_entity import _base


@attr.s
class Threat(_base.Base, _base.WithTitleAndCode):
  """Represents Threat entity."""
  admins = attr.ib()
  comments = attr.ib()
  review_status = attr.ib()
  state = attr.ib()
