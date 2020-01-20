# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Module for ggrc background operation types."""
from ggrc import db
from ggrc.models import mixins


class BackgroundOperationType(mixins.Base, db.Model):
  """Background operation type model."""
  __tablename__ = 'background_operation_types'

  name = db.Column(db.String, nullable=False)
