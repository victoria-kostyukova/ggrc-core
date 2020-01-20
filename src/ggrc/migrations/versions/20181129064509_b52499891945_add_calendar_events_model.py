# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Add calendar events model

Create Date: 2018-11-29 06:45:09.432087
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = 'b52499891945'
down_revision = '3a64f54e50e9'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.create_table(
      'calendar_events',
      sa.Column('id', sa.Integer(), nullable=False),
      sa.Column('external_event_id', sa.String(length=250), nullable=True),
      sa.Column('title', sa.String(length=250), nullable=False),
      sa.Column('description', sa.String(length=2000), nullable=True),
      sa.Column('attendee_id', sa.Integer(), nullable=False),
      sa.Column('due_date', sa.Date(), nullable=False),
      sa.Column('last_synced_at', sa.DateTime(), nullable=True),
      sa.Column('created_at', sa.DateTime(), nullable=False),
      sa.Column('updated_at', sa.DateTime(), nullable=False),
      sa.Column('modified_by_id', sa.Integer(), nullable=True),

      sa.ForeignKeyConstraint(['attendee_id'], ['people.id']),
      sa.ForeignKeyConstraint(['modified_by_id'], ['people.id']),
      sa.PrimaryKeyConstraint('id')
  )
  op.create_index('ix_calendar_events', 'calendar_events',
                  ['due_date', 'attendee_id'], unique=False)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  op.drop_index('ix_calendar_events', table_name='calendar_events')
  op.drop_table('calendar_events')
