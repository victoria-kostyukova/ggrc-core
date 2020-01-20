# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Add modified_by_id column to objects_without_revisions

Create Date: 2018-12-06 06:34:05.917633
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa

from alembic import op

from ggrc.migrations.utils.migrator import get_migration_user_id

# revision identifiers, used by Alembic.
revision = '5bb7c74d2089'
down_revision = '8737b9b51407'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""

  op.add_column(
      'objects_without_revisions',
      sa.Column('modified_by_id', sa.Integer, nullable=True)
  )

  # It's possible that the table already contains some records added by
  # previous migration scripts.
  # We need to set modified_by_id to default migrator for those records
  rev_table = sa.sql.table('objects_without_revisions',
                           sa.sql.column('modified_by_id', sa.Integer))
  migrator_id = get_migration_user_id(op.get_bind())
  op.execute(rev_table.update().values(modified_by_id=migrator_id))


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""

  raise Exception("Downgrade is not supported")
