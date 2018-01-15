# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Add Evidence model

Create Date: 2018-01-15 07:59:54.664574
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = '207955a2d3c1'
down_revision = '3911f39325b4'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.create_table(
      'evidences',
      sa.Column('id', sa.Integer(), nullable=False),
      sa.Column('link', sa.String(length=250), nullable=False),
      sa.Column('gdrive_file_id', sa.String(length=250), nullable=True),
      sa.Column('description', sa.Text(), nullable=False),
      sa.Column('document_type', sa.Enum('URL', 'EVIDENCE', 'REFERENCE_URL'),
                nullable=False),
      sa.Column('title', sa.String(length=250), nullable=False),
      sa.Column('updated_at', sa.DateTime(), nullable=False),
      sa.Column('modified_by_id', sa.Integer(), nullable=True),
      sa.Column('created_at', sa.DateTime(), nullable=False),
      sa.Column('context_id', sa.Integer(), nullable=True),
      sa.ForeignKeyConstraint(['context_id'], ['contexts.id']),
      sa.PrimaryKeyConstraint('id'),
      sa.UniqueConstraint('title', name='uq_t_evidences')
  )
  op.create_index('fk_evidences_contexts', 'evidences',
                  ['context_id'], unique=False)
  op.create_index('ix_evidences_updated_at', 'evidences',
                  ['updated_at'], unique=False)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  op.drop_index('ix_evidences_updated_at', table_name='evidences')
  op.drop_index('fk_evidences_contexts', table_name='evidences')
  op.drop_table('evidences')
