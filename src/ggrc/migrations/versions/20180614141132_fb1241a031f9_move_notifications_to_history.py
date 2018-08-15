# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Move notifications to history

Create Date: 2018-06-14 14:11:32.004664
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision = 'fb1241a031f9'
down_revision = 'aed91dd7ab9d'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.create_table(
      'notifications_history',
      sa.Column('id', sa.Integer(), nullable=False),
      sa.Column('object_id', sa.Integer, nullable=False),
      sa.Column('object_type', sa.String(length=250), nullable=False),
      sa.Column('notification_type_id', sa.Integer(), nullable=False),
      sa.Column('send_on', sa.DateTime(), nullable=False),
      sa.Column('sent_at', sa.DateTime(), nullable=True),
      sa.Column('custom_message', sa.Text(), nullable=False),
      sa.Column('force_notifications', sa.Boolean(), nullable=False,
                server_default="0"),
      sa.Column('created_at', sa.DateTime(), nullable=False),
      sa.Column('modified_by_id', sa.Integer(), nullable=True),
      sa.Column('updated_at', sa.DateTime(), nullable=False),
      sa.Column('context_id', sa.Integer(), nullable=True),
      sa.Column('repeating', sa.Boolean(), nullable=False, server_default="0"),

      sa.PrimaryKeyConstraint('id'),
      sa.ForeignKeyConstraint(['notification_type_id'],
                              ['notification_types.id'], ),
      sa.ForeignKeyConstraint(['modified_by_id'], ['people.id'], ),
  )

  op.execute("INSERT INTO notifications_history "
             "SELECT * FROM notifications "
             "WHERE sent_at IS NOT NULL AND repeating != 1")

  op.execute("DELETE FROM notifications "
             "WHERE sent_at IS NOT NULL AND repeating != 1")


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  op.execute("INSERT INTO notifications SELECT * FROM notifications_history")
  op.drop_table("notifications_history")
