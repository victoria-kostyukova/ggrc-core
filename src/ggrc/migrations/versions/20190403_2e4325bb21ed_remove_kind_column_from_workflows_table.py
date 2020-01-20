# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Remove kind column from workflows table

Create Date: 2019-04-03 12:09:28.247582
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op


# revision identifiers, used by Alembic.
revision = '2e4325bb21ed'
down_revision = '724fcf70a349'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.drop_column('workflows', 'kind')


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
