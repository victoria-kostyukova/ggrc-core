# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Add new ACR Assignee, Verifier, Compliance Contacts and merge Contacts

Create Date: 2018-08-15 15:19:46.890174
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op

from ggrc.migrations.utils.migrator import get_migration_user_id
from ggrc.migrations.utils import \
    acr_propagation_constants_scoping_objects_merge_roles \
    as scoping_objects_rules
from ggrc.migrations.utils import acr_propagation

# revision identifiers, used by Alembic.
revision = '210d6ec78436'
down_revision = '31cde07a1abe'


SCOPING_OBJECTS = [
    "AccessGroup",
    "DataAsset",
    "Facility",
    "Market",
    "Metric",
    "OrgGroup",
    "Process",
    "Product",
    "ProductGroup",
    "Project",
    "System",
    "TechnologyEnvironment",
    "Vendor",
]

NEW_ROLES = [
    "Assignee",
    "Verifier",
    "Compliance Contacts",
]

MANDATORY = {
    "Assignee": 1,
    "Verifier": 1,
    "Compliance Contacts": 0,
}

DEFAULT_TO_CURRENT_USER = {
    "Assignee": 1,
    "Verifier": 1,
    "Compliance Contacts": 0,
}


def _add_roles_for_objects(objects, new_roles):
  """
    Creates new roles in acr for a given list of objects.
  :param objects: object names for which new roles should be added
  :param new_roles: list of roles to add into the acr
  """
  connection = op.get_bind()
  user_id = get_migration_user_id(connection)

  update_entries = []
  for object_name in objects:
    for role_name in new_roles:
      update_entries.append(
          "('{}', '{}', NOW(), NOW(), {}, 1, {}, {})".format(
              role_name,
              object_name,
              user_id,
              MANDATORY[role_name],
              DEFAULT_TO_CURRENT_USER[role_name]
          )
      )
  insert_sql = """
      INSERT INTO access_control_roles (
          name,
          object_type,
          created_at,
          updated_at,
          modified_by_id,
          non_editable,
          mandatory,
          default_to_current_user
      ) values """ + ", ".join(update_entries)
  connection.execute(insert_sql)


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  # Add Assignee, Verifier roles
  _add_roles_for_objects(SCOPING_OBJECTS, NEW_ROLES)
  # Propagate Assignee, Verifier roles
  acr_propagation.propagate_roles(
      scoping_objects_rules.GGRC_NEW_ROLES_PROPAGATION,
      with_update=True
  )


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise Exception("Downgrade is not supported.")
