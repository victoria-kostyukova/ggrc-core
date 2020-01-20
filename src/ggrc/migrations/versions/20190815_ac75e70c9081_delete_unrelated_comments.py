# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
delete unrelated comments

Create Date: 2019-08-15 10:19:30.209847
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa

from alembic import op
from ggrc.migrations import utils

# revision identifiers, used by Alembic.
revision = 'ac75e70c9081'
down_revision = '8937c6e26f00'


def remove_comments(conn, data):
  """Removes comments from Comment table.

  Args:
    conn: An instance of SQLAlchemy connection.
    data: List of comment ids to be deleted.
  Returns:
    -
  """
  comment_ids = [d.id for d in data]
  if comment_ids:
    conn.execute(
        sa.text("""
              DELETE FROM comments
              WHERE id IN :comment_ids
              """),
        comment_ids=comment_ids)
    utils.add_to_objects_without_revisions_bulk(
        conn, comment_ids, "Comment", "deleted"
    )


def load_comments_data(conn):
  """Load comment necessary data for migration

  Args:
    conn: An instance of SQLAlchemy connection.
  Returns:
    List of comment ids which have no relationships with other objects
  """
  sql = """
    SELECT source_id as id FROM relationships WHERE
    (source_type = 'Comment' AND destination_type != 'Comment')

    UNION ALL

    SELECT destination_id as id FROM relationships WHERE
    (source_type != 'Comment' AND destination_type = 'Comment')
  """
  comment_ids = conn.execute(
      sa.text(
          """SELECT id FROM comments WHERE id NOT IN ({});""".format(sql),
      )
  ).fetchall()
  return comment_ids


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  conn = op.get_bind()
  comment_ids = load_comments_data(conn)
  remove_comments(conn, comment_ids)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
