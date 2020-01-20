# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Add access_control_people table

Create Date: 2018-08-28 21:55:27.476331
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = '65b65cb7e57c'
down_revision = 'ee7ba3ba8aa8'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.create_table(
      'access_control_people',
      sa.Column('id', sa.Integer(), nullable=False),
      sa.Column('person_id', sa.Integer(), nullable=False),
      sa.Column('ac_list_id', sa.Integer(), nullable=False),
      sa.Column('updated_at', sa.DateTime(), nullable=False),
      sa.Column('modified_by_id', sa.Integer(), nullable=True),
      sa.Column('created_at', sa.DateTime(), nullable=False),
      sa.ForeignKeyConstraint(['ac_list_id'], ['access_control_list.id']),
      sa.ForeignKeyConstraint(['person_id'], ['people.id'], ),
      sa.PrimaryKeyConstraint('id', 'person_id', 'ac_list_id')
  )
  op.create_index('ix_access_control_people_updated_at',
                  'access_control_people', ['updated_at'], unique=False)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  op.drop_index('ix_access_control_people_updated_at',
                table_name='access_control_people')
  op.drop_table('access_control_people')
