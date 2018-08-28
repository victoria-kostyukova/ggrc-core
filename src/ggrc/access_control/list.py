# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Access Control List model"""

from ggrc import db
from ggrc.models import mixins
from ggrc.models import reflection
from ggrc.models.mixins import base


class AccessControlList(base.ContextRBAC, mixins.Base, db.Model):
  """Access Control List

  Model is a mapping between a role and an object. It creates a base for
  permissions of the role for mapping a person to this permission.
  """
  __tablename__ = 'access_control_list'
  _api_attrs = reflection.ApiAttributes(
      "ac_role_id"
  )

  ac_role_id = db.Column(db.Integer, db.ForeignKey(
      'access_control_roles.id'), nullable=False)
  object_id = db.Column(db.Integer, nullable=False)
  object_type = db.Column(db.String, nullable=False)

  parent_id_nn = db.Column(
      db.Integer,
      nullable=False,
      default="0",
  )
  base_id = db.Column(
      db.Integer,
      db.ForeignKey('access_control_list.id', ondelete='CASCADE'),
      nullable=True,
  )
  parent_id = db.Column(
      db.Integer,
      db.ForeignKey('access_control_list.id', ondelete='CASCADE'),
      nullable=True,
  )
  parent = db.relationship(
      lambda: AccessControlList,  # pylint: disable=undefined-variable
      foreign_keys=lambda: AccessControlList.parent_id,
      remote_side=lambda: AccessControlList.id,
  )

  @property
  def object_attr(self):
    return '{0}_object'.format(self.object_type)

  @property
  def object(self):
    return getattr(self, self.object_attr)

  @object.setter
  def object(self, value):
    self.object_id = getattr(value, 'id', None)
    self.object_type = getattr(value, 'type', None)
    return setattr(self, self.object_attr, value)

  @staticmethod
  def _extra_table_args(_):
    return (
        db.UniqueConstraint(
            'ac_role_id',
            'object_id',
            'object_type',
            'parent_id_nn',
        ),
        db.Index('idx_object_type_object_idx', 'object_type', 'object_id'),
        db.Index('ix_role_object', 'ac_role_id', 'object_type', 'object_id'),
        db.Index(
            'idx_object_type_object_id_parent_id_nn',
            'object_type',
            'object_id',
            'parent_id_nn',
        ),
    )
