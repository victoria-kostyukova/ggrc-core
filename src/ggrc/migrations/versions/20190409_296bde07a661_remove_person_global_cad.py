# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Remove person global CAD

Create Date: 2019-04-09 09:05:39.320348
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op


# revision identifiers, used by Alembic.
revision = '296bde07a661'
down_revision = '4bce07fcb125'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.execute("""
    UPDATE custom_attribute_definitions SET
      attribute_type = "Text"
    WHERE
      definition_id IS NULL AND
      attribute_type = "Map:Person"
  """)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
