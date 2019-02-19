# Copyright (C) 2019 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Add GGRCQ attributes for Control

Create Date: 2019-02-18 09:03:47.118242
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa

from alembic import op


# revision identifiers, used by Alembic.
revision = "da49d3baf2ec"
down_revision = "54ca43587721"


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.add_column("controls",
                sa.Column("due_date", sa.Date, nullable=True))
  op.add_column("controls",
                sa.Column("created_by_id", sa.Integer, nullable=True))
  op.add_column("controls",
                sa.Column("last_submitted_at", sa.DateTime, nullable=True))
  op.add_column("controls",
                sa.Column("last_submitted_by", sa.Integer, nullable=True))
  op.add_column("controls",
                sa.Column("last_verified_at", sa.DateTime,
                          nullable=True))
  op.add_column("controls",
                sa.Column("last_verified_by", sa.Integer,
                          nullable=True))
  op.add_column("controls",
                sa.Column("external_slug", sa.String(250), nullable=True))

  op.create_unique_constraint(
      "uq_external_slug", "controls", ["external_slug"])


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  pass
