# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
add index to unique constraint in cavs

Create Date: 2019-09-12 10:34:28.345496
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op


# revision identifiers, used by Alembic.
revision = '51cadec32665'
down_revision = '4285a09ebcc0'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""

  op.execute("""
      ALTER TABLE `custom_attribute_values`
      DROP INDEX `uq_custom_attribute_value`,
      ADD UNIQUE `uq_custom_attribute_value`
      (`custom_attribute_id`,`attributable_id`, `attribute_object_id_nn`)
  """)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
