# Copyright (C) 2019 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Module for ExternalMapper model"""

from ggrc import db
from ggrc.models.inflector import ModelInflectorDescriptor
from ggrc.models.mixins.base import CreationTimeTracked


class ExternalMapping(CreationTimeTracked, db.Model):
  """Class of ExternalMapper model"""

  __tablename__ = "external_mappings"
  __table_args__ = (
      db.PrimaryKeyConstraint("external_id", "external_type"),)

  _inflector = ModelInflectorDescriptor()

  object_type = db.Column(db.String(250))
  object_id = db.Column(db.Integer)
  external_id = db.Column(db.Integer)
  external_type = db.Column(db.String(250))
