# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Set default values in notifications table

Create Date: 2019-03-28 17:24:22.465426
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op


# revision identifiers, used by Alembic.
revision = '42ac8162b810'
down_revision = 'd082b0964ab4'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.execute(
      "ALTER TABLE notifications ALTER force_notifications SET DEFAULT 0")
  op.execute("ALTER TABLE notifications ALTER repeating SET DEFAULT 0")


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
