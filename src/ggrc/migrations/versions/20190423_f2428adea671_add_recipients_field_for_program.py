# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
add recipients field for Program

Create Date: 2019-04-23 10:09:03.352680
"""

# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import datetime

import sqlalchemy as sa
from sqlalchemy.dialects import mysql

from alembic import op
from ggrc.migrations import utils
from ggrc.migrations.utils import migrator

# revision identifiers, used by Alembic.
revision = 'f2428adea671'
down_revision = '2168ca30ae3b'


default_recipients = ("Program Managers,Program Editors,Program Readers,"
                      "Primary Contacts,Secondary Contacts")


def add_recipients_column():
  """Add recipients column to programs table."""
  op.add_column(
      "programs",
      sa.Column("recipients", sa.String(length=250),
                nullable=True, default=default_recipients),
  )
  op.add_column(
      "programs",
      sa.Column("send_by_default", mysql.TINYINT(display_width=1),
                nullable=True, default=True),
  )


def fill_programs_recipients(connection):
  """Fill program recipients with default value."""
  migrator_id = migrator.get_migration_user_id(connection)
  program_table = sa.sql.table(
      "programs",
      sa.Column('id', sa.Integer(), nullable=False),
      sa.Column('recipients', sa.String(length=250), nullable=True),
      sa.Column('send_by_default', mysql.TINYINT(display_width=1),
                nullable=True),
      sa.Column('updated_at', sa.DateTime, nullable=False),
      sa.Column('modified_by_id', sa.Integer, nullable=True),
  )

  connection.execute(
      program_table.update().values(
          recipients=default_recipients,
          updated_at=datetime.datetime.utcnow(),
          modified_by_id=migrator_id,
          send_by_default=True,
      )
  )
  programs = connection.execute(
      program_table.select()
  ).fetchall()
  return [program.id for program in programs]


def add_revisions(connection, program_ids):
  """Add revisions for modified objects."""
  utils.add_to_objects_without_revisions_bulk(
      connection, program_ids, "Program", action="modified"
  )


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  connection = op.get_bind()
  add_recipients_column()
  program_ids = fill_programs_recipients(connection)
  add_revisions(connection, program_ids)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise Exception("Downgrade is not supported.")
