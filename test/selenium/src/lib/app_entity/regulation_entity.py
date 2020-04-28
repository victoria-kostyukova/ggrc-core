# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Regulation entities."""
import attr

from lib.app_entity import _base


@attr.s
class Regulation(_base.Base, _base.WithTitleAndCode):
  """Represents Regulation entity."""
  title = attr.ib()
