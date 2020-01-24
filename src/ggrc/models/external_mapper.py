# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Module for ExternalMapper model"""

from sqlalchemy.orm import validates

from ggrc import db
from ggrc.models.inflector import ModelInflectorDescriptor
from ggrc.models.mixins.base import CreationTimeTracked, Dictable
from ggrc.models.exceptions import ValidationError


class ExternalMapping(CreationTimeTracked, Dictable, db.Model):
  """Class of ExternalMapper model"""

  __tablename__ = "external_mappings"
  __table_args__ = (
      db.PrimaryKeyConstraint("external_id", "external_type"),)

  _inflector = ModelInflectorDescriptor()

  object_type = db.Column(db.String(255))
  object_id = db.Column(db.Integer)
  external_id = db.Column(db.Integer)
  external_type = db.Column(db.String(255))

  _api_attrs = [
      "object_type",
      "object_id",
      'external_id',
      "external_type",
  ]

  ALLOWED_TYPES = (
      "custom_attribute_definition",
      "CustomAttributeDefinition",
  )

  @validates("external_id", "object_id")
  def validate_ids(self, key, value):
    # pylint: disable=no-self-use
    """
    Validate external_id and object_id fields

    Args:
      key: str() attribute name
      value: int() incoming value of attribute

    Returns:
        Validated value.

    Raises:
        ValidationError: value is not of int() type.
    """
    if not isinstance(value, (int, long)):
      raise ValidationError("'{}' should be of int() type.".format(key))

    return value

  @validates("external_type")
  def validate_types(self, key, value):
    # pylint: disable=no-self-use
    """
    Validate external_id and object_id fields

    Args:
      key: str() attribute name
      value: int() incoming value of attribute

    Returns:
        Validated value.

    Raises:
        ValidationError: value is not of int() type.
    """
    if value not in ExternalMapping.ALLOWED_TYPES:
      raise ValidationError("'{}' value are not allowed.".format(key))

    return value


def create_external_mapping(obj, src):
  """
      Creating external mapping object
  Args:
    obj: A list of model instances created from the POSTed JSON.
    src: A list of original POSTed JSON dictionaries.
  """
  mapping_data = {
      "external_type": src["external_type"],
      "external_id": src["external_id"],
      "object_type": obj.type,
      "object_id": obj.id,
  }

  mapping = ExternalMapping(**mapping_data)
  db.session.add(mapping)
  db.session.commit()
