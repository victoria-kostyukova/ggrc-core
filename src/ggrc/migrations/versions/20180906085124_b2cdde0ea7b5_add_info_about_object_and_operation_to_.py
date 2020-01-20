# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Add info about object and operation to BG task

Create Date: 2018-09-06 08:51:24.838989
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
from ggrc.migrations.utils import migrator

revision = 'b2cdde0ea7b5'
down_revision = '3bbaeab12163'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.create_table(
      "background_operation_types",
      sa.Column("id", sa.Integer(), primary_key=True),
      sa.Column("name", sa.String(length=250), nullable=False),
      sa.Column("modified_by_id", sa.Integer(), nullable=True),
      sa.Column("created_at", sa.DateTime()),
      sa.Column("updated_at", sa.DateTime()),
  )

  op.create_table(
      "background_operations",
      sa.Column("id", sa.Integer(), primary_key=True),
      sa.Column("bg_operation_type_id", sa.Integer, nullable=False),
      sa.Column("bg_task_id", sa.Integer, nullable=False),
      sa.Column("object_type", sa.String(length=250), nullable=False),
      sa.Column("object_id", sa.Integer(), nullable=False),
      sa.Column("modified_by_id", sa.Integer(), nullable=True),
      sa.Column("created_at", sa.DateTime()),
      sa.Column("updated_at", sa.DateTime()),
      sa.ForeignKeyConstraint(
          ["bg_operation_type_id"],
          ["background_operation_types.id"],
      ),
      sa.ForeignKeyConstraint(["bg_task_id"], ["background_tasks.id"])
  )

  connection = op.get_bind()
  migrator_id = migrator.get_migration_user_id(connection)
  connection.execute(
      sa.text("""
          INSERT INTO background_operation_types(
            `name`, modified_by_id, created_at, updated_at
          )
          SELECT 'generate_children_issues', :migrator_id, now(), now();
      """),
      migrator_id=migrator_id,
  )


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  op.drop_table("background_operations")
  op.drop_table("background_operation_types")
