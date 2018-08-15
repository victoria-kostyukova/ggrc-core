# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Add new ACR

Create Date: 2018-08-07 07:27:30.162202
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op
from ggrc.migrations.utils.migrator import get_migration_user_id

# revision identifiers, used by Alembic.
revision = '50b90430fb62'
down_revision = '61f4e42f00a9'

SCOPING_OBJECTS = [
    "AccessGroup", "DataAsset", "Facility", "Market", "Metric",
    "OrgGroup", "Process", "Product", "ProductGroup", "Project", "System",
    "TechnologyEnvironment", "Vendor"
]

NEW_ROLES = [
    "Product Managers",
    "Technical Leads",
    "Technical / Program Managers",
    "Legal Counsels",
    "System Owners",
]


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  connection = op.get_bind()
  user_id = get_migration_user_id(connection)

  update_entries = []
  for object_name in SCOPING_OBJECTS:
    for role_name in NEW_ROLES:
      update_entries.append(
          "('{}', '{}', NOW(), NOW(), {}, 1)".format(role_name,
                                                     object_name,
                                                     user_id)
      )

  insert_sql = """
      INSERT INTO access_control_roles (
          name,
          object_type,
          created_at,
          updated_at,
          modified_by_id,
          non_editable
      ) values """ + ", ".join(update_entries)
  connection.execute(insert_sql)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  connection = op.get_bind()
  delete_sql = """DELETE FROM access_control_roles WHERE name in (%s)""" \
               % ",".join(["'{}'".format(name) for name in NEW_ROLES])
  connection.execute(delete_sql)
