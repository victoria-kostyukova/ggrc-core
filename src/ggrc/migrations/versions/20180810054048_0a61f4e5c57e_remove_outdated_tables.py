# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Remove outdated tables

Create Date: 2018-08-10 05:40:48.015005
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op

# revision identifiers, used by Alembic.
revision = '0a61f4e5c57e'
down_revision = '189b3c9b694a'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  conn = op.get_bind()
  res = conn.execute("show tables")
  results = res.fetchall()
  existing = {tname for (tname, ) in results}
  # We check if the table name exists before droping the table because
  # DROP TABLE IF EXISTS shows ugly warnings
  for table_to_drop in (
      "acl_copy",
      "acr_copy",
  ):
    if table_to_drop in existing:
      op.drop_table(table_to_drop)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  pass
