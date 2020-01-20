# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
make user mandatory for Person

Create Date: 2019-05-14 08:32:27.609326
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op

# revision identifiers, used by Alembic.
revision = '437d91566937'
down_revision = '0cc3ce187621'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.execute("""
      ALTER TABLE people
      MODIFY COLUMN name VARCHAR (250) NOT NULL
  """)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
