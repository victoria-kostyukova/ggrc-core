# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
update empty name from email

Create Date: 2019-06-04 11:35:57.993731
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op
from ggrc.migrations import utils


# revision identifiers, used by Alembic.
revision = '1f6da86c4564'
down_revision = '437d91566937'


def get_users_without_name(conn):
  """Get users with empty name column"""
  res = conn.execute("""
      SELECT id FROM people
      WHERE name=''
  """)
  ids = [person[0] for person in res.fetchall()]
  return ids


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  conn = op.get_bind()
  ids = get_users_without_name(conn)
  utils.add_to_objects_without_revisions_bulk(
      conn, ids, obj_type="Person", action="modified"
  )

  migrator_id = utils.migrator.get_migration_user_id(conn)
  op.execute("""
      UPDATE people
      SET name=SUBSTRING_INDEX(email, '@', 1), modified_by_id={migrator_id}
      WHERE name=''
  """.format(migrator_id=migrator_id))


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
