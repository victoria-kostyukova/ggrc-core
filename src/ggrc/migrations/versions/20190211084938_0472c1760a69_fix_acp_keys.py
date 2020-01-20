# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Fix acp keys

Create Date: 2019-02-11 08:49:38.964639
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name


from alembic import op


# revision identifiers, used by Alembic.
revision = '0472c1760a69'
down_revision = '771c70dd6be3'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.execute("""
    ALTER TABLE access_control_people
    DROP KEY uq_access_control_people;
  """)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
