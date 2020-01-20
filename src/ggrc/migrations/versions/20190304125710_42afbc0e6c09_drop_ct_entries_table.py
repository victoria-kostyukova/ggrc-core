# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
drop cycle task entries table

Create Date: 2019-03-04 12:57:10.765583
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op

# revision identifiers, used by Alembic.
revision = '42afbc0e6c09'
down_revision = '2e4325bb21ed'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""

  op.drop_table('cycle_task_entries')


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
