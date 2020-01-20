# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
remove unused coloumn sort_index

Create Date: 2019-04-17 12:40:12.199009
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op

# revision identifiers, used by Alembic.
revision = 'f911d14458c5'
down_revision = 'fd7f3834a37e'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.drop_column('cycle_task_group_object_tasks', 'sort_index')
  op.drop_column('cycle_task_groups', 'sort_index')
  op.drop_column('task_group_tasks', 'sort_index')
  op.drop_column('task_groups', 'sort_index')


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
