# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Rename reviewer to reviewers

Create Date: 2019-03-06 11:32:17.054147
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op

# revision identifiers, used by Alembic.
revision = 'adf7bdb8996e'
down_revision = 'f53a6dc80a57'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  conn = op.get_bind()
  conn.execute("UPDATE access_control_roles SET name='Reviewers'\
                  WHERE parent_id is NULL and name='Reviewer'")


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
