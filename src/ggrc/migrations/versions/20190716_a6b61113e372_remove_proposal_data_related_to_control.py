# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
remove proposal data related to control model

Create Date: 2019-07-16 11:15:53.675414
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa

from alembic import op

from ggrc.migrations import utils


# revision identifiers, used by Alembic.
revision = 'a6b61113e372'
down_revision = 'f00343450894'


def create_old_rel_del_revisions(conn, data):
  """Remove old relationship revisions."""
  old_rel_ids = [d.id for d in data]
  if old_rel_ids:
    for rel_id in old_rel_ids:
      utils.add_to_objects_without_revisions(
          conn, rel_id, "Relationship", "deleted"
      )


def remove_relationships(conn, data):
  """Remove old control relationships"""
  old_rel_ids = [d.id for d in data]
  if old_rel_ids:
    conn.execute(
        sa.text("DELETE FROM relationships WHERE id IN :rel_ids"),
        rel_ids=old_rel_ids
    )


def create_old_proposal_del_revisions(conn, data):
  """Remove old proposal revisions."""
  old_prop_ids = [d.id for d in data]
  if old_prop_ids:
    utils.add_to_objects_without_revisions_bulk(
        conn, old_prop_ids, "Proposal", "deleted"
    )


def remove_proposal(conn):
  """Remove old proposals for controls"""
  conn.execute(
      sa.text("DELETE FROM proposals WHERE instance_type = 'Control'"),
  )


def load_relationships_data(conn):
  """Load relationships necessary data for migration"""
  rel_data = conn.execute(
      sa.text("SELECT id FROM relationships WHERE "
              "(source_type = 'Control' AND destination_type = 'Proposal')"
              "OR "
              "(source_type = 'Proposal' AND destination_type = 'Control')"
              ),
  ).fetchall()
  return rel_data


def load_proposal_data(conn):
  """Load proposals necessary data for migration"""
  proposal_data = conn.execute(
      sa.text("SELECT id FROM proposals WHERE instance_type = 'Control'"),
  ).fetchall()
  return proposal_data


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  conn = op.get_bind()
  rel_data = load_relationships_data(conn)
  proposal_data = load_proposal_data(conn)
  create_old_rel_del_revisions(conn, rel_data)
  create_old_proposal_del_revisions(conn, proposal_data)
  remove_relationships(conn, rel_data)
  remove_proposal(conn)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
