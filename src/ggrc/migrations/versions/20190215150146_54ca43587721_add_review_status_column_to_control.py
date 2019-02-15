# Copyright (C) 2019 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Add review_status column to control

Create Date: 2019-02-15 15:01:46.215703
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa

from alembic import op


# revision identifiers, used by Alembic.
revision = '54ca43587721'
down_revision = 'a6554e0b1bf4'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.add_column(
      'controls',
      sa.Column('review_status', sa.String(length=250), nullable=True),
  )
  op.add_column(
      'controls',
      sa.Column('review_status_display_name', sa.String(length=250),
                nullable=True),
  )


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError()
