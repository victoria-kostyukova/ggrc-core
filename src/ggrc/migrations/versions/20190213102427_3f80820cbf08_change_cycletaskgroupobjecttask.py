# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Change CycleTaskGroupObjectTask finished_date and verified_date type
from DateTime to Date

Create Date: 2019-02-13 10:24:27.731045
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = '3f80820cbf08'
down_revision = 'a8a44ea42a2b91'

columns = ["finished_date", "verified_date"]


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  for column in columns:
    op.alter_column(
        "cycle_task_group_object_tasks",
        column,
        existing_type=sa.DateTime,
        type_=sa.Date
    )


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
