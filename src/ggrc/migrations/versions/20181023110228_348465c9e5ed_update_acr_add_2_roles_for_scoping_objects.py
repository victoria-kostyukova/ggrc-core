# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Add 2 new roles for scoping objects

Create Date: 2018-10-23 11:02:28.166523
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import datetime

from alembic import op

from ggrc.migrations.utils import migrator
from ggrc.migrations.utils import (
    acr_propagation_constants_scoping_objects_new_roles as acr_constants
)
from ggrc.migrations.utils import acr_propagation

# revision identifiers, used by Alembic.
revision = '348465c9e5ed'
down_revision = 'cb58d1d52368'


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
    "Line of Defense One Contacts",
    "Vice Presidents",
]


def _add_roles_for_objects(objects, new_roles):
  """ Creates new roles in acr for a given list of objects.

    Args:
      objects: object names for which new roles should be added
      new_roles: list of roles to add into the acr
  """
  connection = op.get_bind()
  user_id = migrator.get_migration_user_id(connection)

  update_entries = []
  for object_name in objects:
    for role_name in new_roles:
      update_entries.append({
          'name': role_name,
          'object_type': object_name,
          'mandatory': False,
          'non_editable': True,
          'created_at': datetime.datetime.now(),
          'updated_at': datetime.datetime.now(),
          'default_to_current_user': False,
          'modified_by_id': user_id,
      })

  op.bulk_insert(
      acr_propagation.ACR_TABLE,
      update_entries
  )


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  _add_roles_for_objects(SCOPING_OBJECTS, NEW_ROLES)
  acr_propagation.propagate_roles(
      acr_constants.GGRC_NEW_ROLES_PROPAGATION,
      with_update=True
  )


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise Exception("Downgrade is not supported.")
