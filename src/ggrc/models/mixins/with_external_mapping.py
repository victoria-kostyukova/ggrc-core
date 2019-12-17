# Copyright (C) 2019 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Module with mixin for ExternalMapper model"""


import sqlalchemy as sa
from sqlalchemy import orm
from sqlalchemy.ext.declarative import declared_attr


class WithExternalMapping(object):
  """Mixin for attributes those contains external info"""

  @declared_attr
  def _external_info(cls):  # pylint: disable=no-self-argument
    """
    Returns:
        relationship with ExternalMapper model
    """

    def join_function():

      """
      Returns:
          SQL expression for join option
      """
      from ggrc.models.external_mapper import ExternalMapping

      mapped_object_type = (cls.__name__ == ExternalMapping.object_type)
      mapped_object_id = (
          cls.id == orm.foreign(orm.remote(ExternalMapping.object_id)))
      relationship = sa.and_(mapped_object_id, mapped_object_type)
      return relationship

    return orm.relationship("ExternalMapping",
                            primaryjoin=join_function,
                            uselist=False)

  @property
  def external_id(self):
    """External id getter"""
    if self._external_info:
      return self._external_info.external_id
    return None

  @property
  def entity_type(self):
    """External type getter"""
    if self._external_info:
      return self._external_info.external_type
    return None
