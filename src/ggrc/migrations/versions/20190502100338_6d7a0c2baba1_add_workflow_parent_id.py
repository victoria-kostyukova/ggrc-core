# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Add parent_id on Workflow and TaskGroup.

Create Date: 2019-05-02 10:03:38.974599
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = '6d7a0c2baba1'
down_revision = '87fa3c8cb442'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.add_column(
      'task_groups', sa.Column('parent_id', sa.Integer(), nullable=True)
  )
  op.create_foreign_key(
      None,
      'task_groups',
      'task_groups', ['parent_id'], ['id'],
      ondelete='SET NULL'
  )

  op.add_column(
      'workflows', sa.Column('parent_id', sa.Integer(), nullable=True)
  )
  op.create_foreign_key(
      None,
      'workflows',
      'workflows', ['parent_id'], ['id'],
      ondelete='SET NULL'
  )


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  op.drop_column('workflows', 'parent_id')
  op.drop_column('task_groups', 'parent_id')
