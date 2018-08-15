# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
empty message

Create Date: 2018-08-03 12:11:49.823569
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name


from alembic import op

# revision identifiers, used by Alembic.
revision = '6bc56d6072a2'
down_revision = 'c17f5f1f273e'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.execute("INSERT INTO notifications_history "
             "SELECT * FROM notifications "
             "WHERE sent_at IS NOT NULL AND repeating != 1")

  op.execute("DELETE FROM notifications "
             "WHERE sent_at IS NOT NULL AND repeating != 1")


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
