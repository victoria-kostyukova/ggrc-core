# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Remove last traces of migration modules

Create Date: 2018-08-27 00:15:31.246519
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op

# revision identifiers, used by Alembic.
revision = 'fe3ce1807a4e'
down_revision = 'ace8f9834418'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  conn = op.get_bind()
  res = conn.execute("show tables")
  results = res.fetchall()
  existing = {tname for (tname, ) in results}
  # We check if the table name exists before droping the table because
  # DROP TABLE IF EXISTS shows ugly warnings
  for table_to_drop in (
      "ggrc_basic_permissions_alembic_version",
      "ggrc_risk_assessments_alembic_version",
      "ggrc_risks_alembic_version",
      "ggrc_workflows_alembic_version"
  ):
    if table_to_drop in existing:
      op.drop_table(table_to_drop)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  # We do not support downgrading back to multiple migration modules, so
  # nothing to do here
  pass
