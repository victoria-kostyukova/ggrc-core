# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Add workflow relationships

Create Date: 2018-08-14 19:50:35.904064
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa

from alembic import op


# revision identifiers, used by Alembic.
revision = 'ace8f9834418'
down_revision = '8aec8b112701'


RELATIONSHIPS = sa.sql.table(
    "relationships",
    sa.sql.column('id', sa.Integer),
    sa.sql.column('source_type', sa.String),
    sa.sql.column('source_id', sa.Integer),
    sa.sql.column('destination_type', sa.String),
    sa.sql.column('destination_id', sa.Integer),
    sa.sql.column('context_id', sa.Integer),
    sa.sql.column('created_at', sa.DateTime),
    sa.sql.column('updated_at', sa.DateTime),
)

CYCLE = sa.sql.table(
    "cycles",
    sa.sql.column('id', sa.Integer),
    sa.sql.column('workflow_id', sa.Integer),
    sa.sql.column('created_at', sa.DateTime),
)

TASK_GROUP = sa.sql.table(
    "task_groups",
    sa.sql.column('id', sa.Integer),
    sa.sql.column('workflow_id', sa.Integer),
    sa.sql.column('created_at', sa.DateTime),
)

TASK_GROUP_TASK = sa.sql.table(
    "task_group_tasks",
    sa.sql.column('id', sa.Integer),
    sa.sql.column('task_group_id', sa.Integer),
    sa.sql.column('created_at', sa.DateTime),
)

TASK_GROUP_OBJECT = sa.sql.table(
    "task_group_objects",
    sa.sql.column('id', sa.Integer),
    sa.sql.column('task_group_id', sa.Integer),
    sa.sql.column('created_at', sa.DateTime),
)

CYCLE_TASK_GROUP = sa.sql.table(
    "cycle_task_groups",
    sa.sql.column('id', sa.Integer),
    sa.sql.column('cycle_id', sa.Integer),
    sa.sql.column('created_at', sa.DateTime),
)

CYCLE_TASK = sa.sql.table(
    "cycle_task_group_object_tasks",
    sa.sql.column('id', sa.Integer),
    sa.sql.column('cycle_task_group_id', sa.Integer),
    sa.sql.column('created_at', sa.DateTime),
)

CYCLE_TASK_ENTRY = sa.sql.table(
    "cycle_task_entries",
    sa.sql.column('id', sa.Integer),
    sa.sql.column('cycle_task_group_object_task_id', sa.Integer),
    sa.sql.column('created_at', sa.DateTime),
)


def _create_relationships(table, source_id, source_type, dst_id, dst_type):
  """Create relationships from the given table.

  Args:
    table: sqlachemy table handle for the select statement,
    source_id: column handle for source id,
    source_type: string literal for source type,
    source_id: column handle for destination id,
    source_type: string literal for destination type,
  """

  select_statement = sa.select([
      sa.literal(source_type).label("object_type"),
      source_id,
      sa.literal(dst_type).label("object_type"),
      dst_id,
      table.c.created_at.label("created_at"),
      table.c.created_at.label("updated_at"),
  ]).select_from(
      table
  )

  inserter = RELATIONSHIPS.insert()
  op.execute(
      inserter.from_select(
          [
              RELATIONSHIPS.c.source_type,
              RELATIONSHIPS.c.source_id,
              RELATIONSHIPS.c.destination_type,
              RELATIONSHIPS.c.destination_id,
              RELATIONSHIPS.c.created_at,
              RELATIONSHIPS.c.updated_at,
          ],
          select_statement
      )
  )


def _remove_relationships(source_type, destination_type):
  op.execute(
      RELATIONSHIPS.delete().where(
          sa.and_(
              RELATIONSHIPS.c.source_type == source_type,
              RELATIONSHIPS.c.destination_type == destination_type,
          )
      )
  )


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""

  _create_relationships(
      CYCLE,
      CYCLE.c.workflow_id,
      "Workflow",
      CYCLE.c.id,
      "Cycle",
  )

  _create_relationships(
      TASK_GROUP,
      TASK_GROUP.c.workflow_id,
      "Workflow",
      TASK_GROUP.c.id,
      "TaskGroup",
  )

  _create_relationships(
      TASK_GROUP_TASK,
      TASK_GROUP_TASK.c.task_group_id,
      "TaskGroup",
      TASK_GROUP_TASK.c.id,
      "TaskGroupTask",
  )

  _create_relationships(
      TASK_GROUP_OBJECT,
      TASK_GROUP_OBJECT.c.task_group_id,
      "TaskGroup",
      TASK_GROUP_OBJECT.c.id,
      "TaskGroupObject",
  )

  _create_relationships(
      CYCLE_TASK_GROUP,
      CYCLE_TASK_GROUP.c.cycle_id,
      "Cycle",
      CYCLE_TASK_GROUP.c.id,
      "CycleTaskGroup",
  )

  _create_relationships(
      CYCLE_TASK,
      CYCLE_TASK.c.cycle_task_group_id,
      "CycleTaskGroup",
      CYCLE_TASK.c.id,
      "CycleTaskGroupObjectTask",
  )

  _create_relationships(
      CYCLE_TASK_ENTRY,
      CYCLE_TASK_ENTRY.c.cycle_task_group_object_task_id,
      "CycleTaskGroupObjectTask",
      CYCLE_TASK_ENTRY.c.id,
      "CycleTaskEntry",
  )


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  _remove_relationships("Workflow", "Cycle")
  _remove_relationships("Workflow", "TaskGroup")
  _remove_relationships("TaskGroup", "TaskGroupTask")
  _remove_relationships("TaskGroup", "TaskGroupObject")
  _remove_relationships("Cycle", "CycleTaskGroup")
  _remove_relationships("CycleTaskGroup", "CycleTaskGroupObjectTask")
  _remove_relationships("CycleTaskGroupObjectTask", "CycleTaskEntry")
