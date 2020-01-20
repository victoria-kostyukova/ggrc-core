# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Adds notify_about_proposal true to program manager editor

Create Date: 2019-07-11 15:15:40.938569
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = '02e4af0bba5b'
down_revision = '6bac46a8d3e7'


def upgrade():
  """Upgrade database schema and/or data"""
  connection = op.get_bind()

  connection.execute(
      sa.text("""UPDATE access_control_roles
                 SET notify_about_proposal = 1
                 WHERE object_type = 'Program' AND name in (
                  'Program Managers', 'Program Editors', 'Primary Contacts'
                 );""")
  )


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
