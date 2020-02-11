# Copyright (C) 2019 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Introduce table with allowed component ids

Create Date: 2020-02-11 11:02:02.910403
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa

from alembic import op


# revision identifiers, used by Alembic.
revision = 'e3577a2b4e03'
down_revision = '75ad21f0622b'


PREDEFINED_COMPONENTS_IDS = [398781, 188208]


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.create_table(
      "issuetracker_components",
      sa.Column("component_id",
                sa.String(length=50),
                nullable=False,
                autoincrement=False),
      sa.PrimaryKeyConstraint("component_id"),
  )
  connection = op.get_bind()
  components = connection.execute("""
      SELECT DISTINCT component_id
      FROM issuetracker_issues
      WHERE component_id IS NOT null;""")
  for component in components:
    connection.execute(
        sa.text("""
            INSERT IGNORE INTO issuetracker_components( component_id )
            VALUES ( :component_id );"""),
        component_id=component.component_id)
  for component_id in PREDEFINED_COMPONENTS_IDS:
    connection.execute(
        sa.text("""
            INSERT IGNORE INTO issuetracker_components( component_id )
            VALUES ( :component_id );"""),
        component_id=component_id)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
