# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Module for ggrc background operations."""
from ggrc import db
from ggrc.models import mixins


class BackgroundOperation(mixins.Base, db.Model):
  """Background operation model."""
  __tablename__ = 'background_operations'

  bg_operation_type_id = db.Column(
      db.Integer,
      db.ForeignKey('background_operation_types.id'),
      nullable=False
  )
  object_type = db.Column(db.String, nullable=False)
  object_id = db.Column(db.Integer, nullable=False)
  bg_task_id = db.Column(db.Integer, db.ForeignKey('background_tasks.id'))

  bg_operation_type = db.relationship("BackgroundOperationType")
