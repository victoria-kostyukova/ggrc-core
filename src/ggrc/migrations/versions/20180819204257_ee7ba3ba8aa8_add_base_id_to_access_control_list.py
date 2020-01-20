# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Add base_id to access control list

Create Date: 2018-08-19 20:42:57.168436
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision = 'ee7ba3ba8aa8'
down_revision = '70e734fea4a4'


def _populate_base_id():
  """Populate base_id values for existing ACL entries."""
  acl_table = sa.sql.table(
      "access_control_list",
      sa.sql.column('id', sa.Integer),
      sa.sql.column('ac_role_id', sa.Integer),
      sa.sql.column('parent_id', sa.Integer),
      sa.sql.column('base_id', sa.Integer),
  )
  op.execute(acl_table.update().values(base_id=acl_table.c.id))


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.add_column(
      'access_control_list',
      sa.Column('base_id', sa.Integer(), nullable=True)
  )
  op.create_foreign_key(
      'fk_access_control_list_base_id',
      'access_control_list',
      'access_control_list',
      ['base_id'],
      ['id'],
      ondelete='CASCADE',
  )
  _populate_base_id()


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  op.drop_constraint(
      'fk_access_control_list_base_id',
      'access_control_list',
      type_='foreignkey',
  )
  op.drop_index(
      'fk_access_control_list_base_id',
      table_name='access_control_list',
  )
  op.drop_column('access_control_list', 'base_id')
