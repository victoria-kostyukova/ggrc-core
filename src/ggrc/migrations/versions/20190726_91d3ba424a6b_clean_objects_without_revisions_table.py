# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Clean objects_without_revisions table

Create Date: 2019-07-26 15:37:52.405620
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op

# revision identifiers, used by Alembic.
revision = '91d3ba424a6b'
down_revision = 'e732f578fa85'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.execute(
      "DELETE FROM objects_without_revisions WHERE"
      " obj_id = 0 AND (obj_type = '' OR obj_type IS NULL)"
  )


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
