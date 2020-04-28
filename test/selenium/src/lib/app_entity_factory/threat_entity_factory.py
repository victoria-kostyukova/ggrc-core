# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Factories for threat entities."""
from lib import users
from lib.app_entity import threat_entity
from lib.app_entity_factory import _base
from lib.constants import object_states


class ThreatFactory(_base.BaseFactory):
  """Factory for Threat entities."""
  _entity_cls = threat_entity.Threat

  @property
  def _empty_attrs(self):
    """See superclass."""
    return {
        "admins": [],
        "comments": []
    }

  @property
  def _default_attrs(self):
    """See superclass."""
    from lib.constants.element import ReviewStates
    return {
        "admins": [users.current_person()],
        "title": self._obj_title,
        "review_status": ReviewStates.UNREVIEWED,
        "state": object_states.DRAFT
    }
