# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Contains a WithReadOnlyAccess mixin.

It allows to mark objects as read-only
"""

import logging

from sqlalchemy.orm import validates

from ggrc import db
from ggrc.fulltext import attributes
from ggrc.models import reflection
from ggrc.models.exceptions import ValidationError


logger = logging.getLogger(__name__)


class WithReadOnlyAccess(object):
  """Mixin for models which can be marked as read-only"""
  # pylint: disable=too-few-public-methods

  _read_only_model_relationships = (
      'Document'
  )

  readonly = db.Column(db.Boolean, nullable=False, default=False)

  _api_attrs = reflection.ApiAttributes(
      reflection.Attribute("readonly", create=True, update=True),
  )

  _aliases = {
      "readonly": {
          "display_name": "Read-only",
          "mandatory": False,
          "hidden": True,
      },
  }

  _fulltext_attrs = [
      attributes.BooleanFullTextAttr(
          'readonly',
          'readonly',
          true_value="yes",
          false_value="no",
      )
  ]

  def can_change_relationship_with(self, obj):
    """Check whether relationship from self to obj1 can be changed

    This function doesn't expect that another obj also has type
    WithReadOnlyAccess. In this case can_change_relationship_with() of
    another object have to be called also to ensure that relationship is
    not read-only. Final read-only flag can be calculated
    using the following expression:
      obj1.can_change_relationship_with(obj2) and \
      obj2.can_change_relationship_with(obj1)
    """

    if not self.readonly:
      return True

    return obj.__class__.__name__ not in self._read_only_model_relationships

  @validates('readonly')
  def validate_readonly(self, _, value):  # pylint: disable=no-self-use
    """Validate readonly"""
    if value is None:
      # if value is not specified or is set to None, use default value False
      return self.readonly

    if not isinstance(value, bool):
      raise ValidationError("Attribute 'readonly' has invalid value")

    return value
