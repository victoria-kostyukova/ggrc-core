# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
update modified_by_id to not null

Create Date: 2019-04-20 00:48:17.544074
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name
import sqlalchemy as sa

from alembic import op

from ggrc.migrations.utils import migrator

# revision identifiers, used by Alembic.
revision = 'b6e89c388581'
down_revision = '0dbe123e4118'


def update_nullable_values():
  """update nullable values with id value"""
  conn = op.get_bind()
  migrator_id = migrator.get_migration_user_id(conn)
  events_table = sa.sql.table(
      'events',
      sa.sql.column('modified_by_id', sa.Integer)
  )

  op.execute(events_table.update().where(
      events_table.c.modified_by_id.is_(None)
  ).values(
      modified_by_id=migrator_id
  ))


def make_modified_by_id_non_null():
  """Alter table to make modified_by_id NOT NULL"""
  op.execute("""
      ALTER TABLE events
      DROP FOREIGN KEY events_modified_by
      """)

  op.execute("""
      ALTER TABLE events
      MODIFY modified_by_id int(11) NOT NULL
      """)

  op.execute("""
      ALTER TABLE events
      ADD CONSTRAINT events_modified_by
      FOREIGN KEY (modified_by_id) REFERENCES people (id)
      """)


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  update_nullable_values()
  make_modified_by_id_non_null()


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
