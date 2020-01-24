# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Delete proposals if instance_id = 0

Create Date: 2020-01-22 11:48:08.884077
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op

from ggrc.migrations import utils

# revision identifiers, used by Alembic.
revision = '14891a489a2d'
down_revision = 'a35b27563863'


def remove_hanging_proposals(conn):
  """Delete proposals if instance_id equals zero"""
  sql = ("""
      DELETE
      FROM proposals
      WHERE instance_id = 0;
  """)
  return conn.execute(sql)


def update_revisions(conn):
  """Updates revisions for deleted proposals."""
  sql = ("""
      SELECT id
      FROM proposals
      WHERE instance_id = 0;
  """)

  deleted_proposals = conn.execute(sql)
  deleted_ids = [proposal.id for proposal in deleted_proposals]

  # add objects to objects without revisions
  if deleted_ids:
    utils.add_to_objects_without_revisions_bulk(conn,
                                                deleted_ids,
                                                "Proposal",
                                                action='deleted',
                                                )


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  conn = op.get_bind()
  update_revisions(conn)
  remove_hanging_proposals(conn)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
