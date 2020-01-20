# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Add people_sync_enabled column to issuetracker_issues table.

Create Date: 2019-03-15 12:11:31.488124
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op


# revision identifiers, used by Alembic.
revision = '2dd5e1292b9c'
down_revision = '014ddab36256'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.execute("""
      ALTER TABLE issuetracker_issues
      ADD people_sync_enabled TINYINT(1) NOT NULL DEFAULT 1
  """)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
