# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Migrate task_group_object to relationship

Create Date: 2019-02-18 11:45:53.733156
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa

from alembic import op

from ggrc.migrations import utils
from ggrc.migrations.utils import migrator
from ggrc.migrations.utils.acr_propagation import update_acr_propagation_tree
from ggrc.migrations.utils\
    import acr_propagation_constants_workflow_remove_task_group_object\
    as acr_propagation_constants


# revision identifiers, used by Alembic.
revision = 'f53a6dc80a57'
down_revision = 'cfe397ab518c'


def load_data(conn):
  """Load all necessary data for migration"""
  sql = """
      SELECT
          tgo.id AS tgo_id,
          tgo.task_group_id AS tgo_task_group_id,
          tgo.object_id AS tgo_object_id,
          tgo.object_type AS tgo_object_type,
          tgo.created_at AS tgo_created_at,
          tgo.modified_by_id AS tgo_modified_by_id,
          tgo.updated_at AS tgo_updated_at,
          tgo.context_id AS tgo_context_id,
          rel_union.id AS tgo_rel_id
      FROM
          task_group_objects tgo
      JOIN(
          SELECT id, destination_id as tgo_id
          FROM relationships
          WHERE
              source_type='TaskGroup' AND
              destination_type='TaskGroupObject'
          UNION ALL
          SELECT id, source_id as tgo_id
          FROM relationships
          WHERE
              source_type='TaskGroupObject' AND
              destination_type = 'TaskGroup'
      ) as rel_union
      ON
          rel_union.tgo_id=tgo.id
      GROUP BY tgo.id
  """
  return conn.execute(sa.text(sql)).fetchall()


def create_relationship(conn, task_group_id, destination_id, destination_type,
                        migrator_id, context_id):
  """Create relationship between mapped object and TaskGroup"""
  sql = """
      INSERT INTO relationships(
          modified_by_id,
          created_at,
          updated_at,
          source_id,
          source_type,
          destination_id,
          destination_type,
          context_id
      ) VALUES (
          :modified_by_id,
          NOW(),
          NOW(),
          :source_id,
          :source_type,
          :destination_id,
          :destination_type,
          :context_id
      )
  """
  conn.execute(
      sa.text(sql),
      modified_by_id=migrator_id,
      source_id=task_group_id,
      source_type="TaskGroup",
      destination_id=destination_id,
      destination_type=destination_type,
      context_id=context_id
  )
  rel_id = utils.last_insert_id(conn)
  utils.add_to_objects_without_revisions(conn, rel_id, "Relationship")
  return rel_id


def remove_old_relationship(conn, data):
  """Remove old relationships"""
  old_rel_ids = [d.tgo_rel_id for d in data]
  if old_rel_ids:
    conn.execute(
        sa.text("DELETE FROM relationships WHERE id IN :rel_ids"),
        rel_ids=old_rel_ids
    )


def create_old_rel_del_revisions(conn, data):
  """Remove old relationship revisions."""
  old_rel_ids = [d.tgo_rel_id for d in data]
  if old_rel_ids:
    for rel_id in old_rel_ids:
      utils.add_to_objects_without_revisions(
          conn, rel_id, "Relationship", "deleted"
      )


def remove_task_group_objects(conn, data):
  """Remove TaskGroupOIbject data"""
  tgo_ids = [d.tgo_id for d in data]
  if tgo_ids:
    conn.execute(
        sa.text("DELETE FROM task_group_objects WHERE id IN :tgo_ids"),
        tgo_ids=tgo_ids
    )
    utils.add_to_objects_without_revisions_bulk(
        conn, tgo_ids, "TaskGroupObject", "deleted"
    )


def run_data_migration():
  """Migration runner"""
  conn = op.get_bind()
  migrator_id = migrator.get_migration_user_id(conn)
  data = load_data(conn)
  update_acr_propagation_tree(
      acr_propagation_constants.CURRENT_PROPAGATION,
      new_tree=acr_propagation_constants.WORKFLOW_PROPAGATION
  )
  for tgo in data:
    create_relationship(
        conn,
        tgo.tgo_task_group_id,
        tgo.tgo_object_id,
        tgo.tgo_object_type,
        migrator_id,
        tgo.tgo_context_id
    )

  create_old_rel_del_revisions(conn, data)
  remove_old_relationship(conn, data)
  remove_task_group_objects(conn, data)


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  run_data_migration()


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
