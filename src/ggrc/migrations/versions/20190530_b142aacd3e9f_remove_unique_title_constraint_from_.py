# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Remove unique title constraint from risk object

Create Date: 2019-05-30 12:12:32.747125
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op

# revision identifiers, used by Alembic.
revision = 'b142aacd3e9f'
down_revision = 'b194e332fa65'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.drop_constraint('uq_t_risks', 'risks', type_='unique')


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
