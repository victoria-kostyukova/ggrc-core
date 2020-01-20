# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Change recipients default value in documents

Create Date: 2019-07-31 07:54:50.726753
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op


# revision identifiers, used by Alembic.
revision = '10b40b26d571'
down_revision = 'a6b61113e372'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.execute("""
        ALTER TABLE documents
        MODIFY COLUMN `recipients`
        VARCHAR (250) NOT NULL DEFAULT 'Admin'
  """)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
