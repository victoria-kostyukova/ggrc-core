# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Remove outdated Sections table

Create Date: 2018-08-09 14:55:23.788185
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa
from sqlalchemy.dialects import mysql

from alembic import op

# revision identifiers, used by Alembic.
revision = '189b3c9b694a'
down_revision = '82db77ebdf55'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.drop_table('sections')


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  op.create_table(
      'sections',
      sa.Column('id', mysql.INTEGER(display_width=11), nullable=False),
      sa.Column(
          'modified_by_id',
          mysql.INTEGER(display_width=11),
          autoincrement=False,
          nullable=True
      ),
      sa.Column('created_at', mysql.DATETIME(), nullable=False),
      sa.Column('updated_at', mysql.DATETIME(), nullable=False),
      sa.Column('description', mysql.TEXT(), nullable=False),
      sa.Column('slug', mysql.VARCHAR(length=250), nullable=False),
      sa.Column('title', mysql.VARCHAR(length=250), nullable=False),
      sa.Column('notes', mysql.TEXT(), nullable=False),
      sa.Column(
          'context_id',
          mysql.INTEGER(display_width=11),
          autoincrement=False,
          nullable=True
      ),
      sa.Column(
          'os_state',
          mysql.VARCHAR(length=16),
          server_default=sa.text(u"'Unreviewed'"),
          nullable=False
      ),
      sa.Column(
          'status',
          mysql.VARCHAR(length=250),
          server_default=sa.text(u"'Draft'"),
          nullable=False
      ),
      sa.Column('recipients', mysql.VARCHAR(length=250), nullable=True),
      sa.Column(
          'send_by_default',
          mysql.TINYINT(display_width=1),
          autoincrement=False,
          nullable=True
      ),
      sa.Column('test_plan', mysql.TEXT(), nullable=False),
      sa.Column('last_deprecated_date', sa.DATE(), nullable=True),
      sa.Column('start_date', sa.DATE(), nullable=True),
      sa.ForeignKeyConstraint(
          ['context_id'],
          [u'contexts.id'],
          name=u'fk_sections_contexts'
      ),
      sa.PrimaryKeyConstraint('id'),
      mysql_default_charset=u'utf8',
      mysql_engine=u'InnoDB'
  )
