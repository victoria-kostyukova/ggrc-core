# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
add is_empty column

Create Date: 2019-03-01 11:32:45.827431
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision = "bba307188ef6"
down_revision = "f2428adea671"


def add_is_empty_col():
  """Add "is_empty" column ob "revisions" table."""
  op.add_column(
      "revisions",
      sa.Column("is_empty", sa.Boolean, default=False, nullable=False),
  )


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  add_is_empty_col()


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
