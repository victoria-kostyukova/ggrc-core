# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Remove title unique contraint from control model

Create Date: 2019-02-26 12:49:13.358736
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op


# revision identifiers, used by Alembic.
revision = '7d10655e87f9'
down_revision = '3b6acfd18e5c'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.drop_constraint('uq_t_controls', 'controls', type_='unique')


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError()
