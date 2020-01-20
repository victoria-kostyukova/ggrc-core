# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Modify access_control_people keys

Create Date: 2018-12-28 14:05:30.202651
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op


# revision identifiers, used by Alembic.
revision = 'f0efc214e735'
down_revision = '7582cfa2cf63'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.execute("""
    ALTER TABLE access_control_people
    ADD CONSTRAINT uq_access_control_people
    UNIQUE (id, person_id, ac_list_id);
  """)
  op.execute("""
    ALTER TABLE access_control_people
    DROP PRIMARY KEY,
    ADD PRIMARY KEY(id);
  """)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
