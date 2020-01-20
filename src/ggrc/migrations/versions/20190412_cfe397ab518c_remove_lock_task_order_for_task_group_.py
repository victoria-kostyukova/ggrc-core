# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
remove_lock_task_order_for_task_group_task

Create Date: 2019-04-12 13:45:53.184163
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op


# revision identifiers, used by Alembic.
revision = 'cfe397ab518c'
down_revision = '42afbc0e6c09'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.drop_column('task_groups', 'lock_task_order')


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
