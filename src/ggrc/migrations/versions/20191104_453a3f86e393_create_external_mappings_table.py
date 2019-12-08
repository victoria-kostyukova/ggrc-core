# Copyright (C) 2019 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Creating table for external mappings

Create Date: 2019-11-04 07:47:19.384426
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa

from alembic import op


# revision identifiers, used by Alembic.
revision = '453a3f86e393'
down_revision = 'd793fa1c1930'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.create_table(
      "external_mappings",
      sa.Column("object_type", sa.String(length=255), nullable=False),
      sa.Column("object_id", sa.Integer, nullable=False),
      sa.Column("external_type", sa.String(length=255), nullable=False),
      sa.Column("external_id", sa.Integer, nullable=False),
      sa.Column("created_at", sa.DateTime, nullable=False),
      sa.UniqueConstraint("external_type", "external_id",
                          name="uq_external_object")
  )


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
