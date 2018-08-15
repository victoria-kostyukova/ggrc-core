# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Remove invalid CycleTask Assessment relationships.

Create Date: 2018-03-28 15:22:31.818792
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op


# revision identifiers, used by Alembic.
revision = '5206dc9f95f0'
down_revision = '4d9b06fb660f'


RELATIONSHIPS_WHERE_CLAUSE = """
(
    source_type = "CycleTaskGroupObjectTask" AND
    destination_type = "Assessment"
) OR (
    source_type = "Assessment" AND
    destination_type = "CycleTaskGroupObjectTask"
)
"""

DELETE_REVISIONS_SQL = """
DELETE FROM revisions
WHERE
    resource_type = "Relationship" AND
    resource_id in (SELECT id FROM relationships WHERE {})
""".format(RELATIONSHIPS_WHERE_CLAUSE)

DELETE_RELATIONSHIPS_SQL = """
DELETE FROM relationships
WHERE {}
""".format(RELATIONSHIPS_WHERE_CLAUSE)


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.execute(DELETE_REVISIONS_SQL)
  op.execute(DELETE_RELATIONSHIPS_SQL)
  op.execute('DELETE FROM task_group_objects WHERE object_type = "Assessment"')


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  pass
