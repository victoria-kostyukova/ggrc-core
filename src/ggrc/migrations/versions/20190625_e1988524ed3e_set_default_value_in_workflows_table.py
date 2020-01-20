# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
set default value in workflows table

Create Date: 2019-06-25 10:06:28.151262
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa

from alembic import op


# revision identifiers, used by Alembic.
revision = 'e1988524ed3e'
down_revision = '1f6da86c4564'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.alter_column('workflows', 'is_verification_needed',
                  existing_type=sa.Boolean(), server_default='0')


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
