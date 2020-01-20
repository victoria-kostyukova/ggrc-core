# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Remove task group objects related to Clauses

Create Date: 2018-11-12 07:51:15.550464
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op


# revision identifiers, used by Alembic.
revision = 'e6f8ba2075a4'
down_revision = '53e115488aec'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.execute("""
      DELETE FROM task_group_objects
      WHERE task_group_objects.object_type = "Clause"
  """)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
