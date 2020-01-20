# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Delete Deprecated Workflow People Table

Create Date: 2019-02-12 10:01:25.015049
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op


# revision identifiers, used by Alembic.
revision = '59b41fe6c145'
down_revision = '0472c1760a69'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.drop_table("workflow_people")


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
