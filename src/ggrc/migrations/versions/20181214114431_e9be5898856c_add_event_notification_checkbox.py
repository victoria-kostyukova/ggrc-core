# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Add event notification checkbox

Create Date: 2018-12-14 11:44:31.164223
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = 'e9be5898856c'
down_revision = 'b52499891945'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.add_column(
      'people_profiles',
      sa.Column('send_calendar_events', sa.Boolean(),
                nullable=True, default=True)
  )
  op.execute("UPDATE people_profiles SET send_calendar_events = true")
  op.alter_column('people_profiles', 'send_calendar_events',
                  type_=sa.Boolean(), nullable=False)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  op.drop_column('people_profiles', 'send_calendar_events')
