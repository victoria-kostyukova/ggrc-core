# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Rename sections to requirements

Create Date: 2018-08-16 12:37:28.232391
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op

# revision identifiers, used by Alembic.
revision = 'd51db6ab92a3'
down_revision = 'b992a3d51db6'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.execute(
      """
          UPDATE `revisions`
          SET `source_type` = "Requirement"
          WHERE `source_type` = "Section"
      """
  )


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
