# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Add `is_visible` flag to `saved_searches` table.

Create Date: 2019-09-12 11:40:45.047398
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision = "1290304b791b"
down_revision = "007ee00ff963"


def add_is_visible_column():
  """Add `is_visible` column to `saved_searches` table."""
  op.add_column(
      "saved_searches",
      sa.Column("is_visible", sa.Boolean, default=True, nullable=False),
  )


def set_is_visible(connection):
  """Set `is_visible` for saved searches with default value."""
  sql = """
      UPDATE saved_searches AS ss
         SET ss.is_visible = true;
  """
  connection.execute(
      sa.text(sql),
  )


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  connection = op.get_bind()
  add_is_visible_column()
  set_is_visible(connection)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
