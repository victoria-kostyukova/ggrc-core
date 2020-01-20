# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Add manual_snapshots column in audit

Create Date: 2018-12-11 12:09:05.431818
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = '44f601715634'
down_revision = 'e9be5898856c'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.add_column('audits',
                sa.Column('manual_snapshots', sa.Boolean(), server_default='0',
                          nullable=False))


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
