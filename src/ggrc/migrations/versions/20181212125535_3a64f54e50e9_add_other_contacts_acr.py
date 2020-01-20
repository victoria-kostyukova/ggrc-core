# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Add Other Contacts ACR

Create Date: 2018-12-12 12:55:35.300348
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name
import datetime

from alembic import op

from ggrc.migrations import utils
from ggrc.migrations.utils import migrator, acr_propagation
from ggrc.migrations.utils import (
    acr_propagation_constants_control_other_contacts as propagation_rule
)

revision = '3a64f54e50e9'
down_revision = '5bb7c74d2089'


def update_control_recipients(connection):
  """Update recipients for existing controls."""
  op.execute("""
      UPDATE controls
      SET recipients = concat(recipients, ',Other Contacts')
  """)

  controls = connection.execute("""SELECT id FROM controls;""").fetchall()
  control_ids = [c.id for c in controls]
  utils.add_to_objects_without_revisions_bulk(
      connection,
      control_ids,
      "Control",
      action="modified",
  )


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  connection = op.get_bind()
  user_id = migrator.get_migration_user_id(connection)

  query = acr_propagation.ACR_TABLE.insert().values(
      name="Other Contacts",
      object_type="Control",
      created_at=datetime.datetime.utcnow(),
      updated_at=datetime.datetime.utcnow(),
      modified_by_id=user_id,
      internal=False,
      non_editable=True,
      mandatory=False,
      read=True,
      update=True,
      delete=True,
  )
  result = connection.execute(query)
  utils.add_to_objects_without_revisions(
      connection,
      result.lastrowid,
      "AccessControlRole"
  )
  acr_propagation.propagate_roles(
      propagation_rule.GGRC_NEW_ROLES_PROPAGATION,
      with_update=True
  )

  update_control_recipients(connection)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise Exception("Downgrade is not supported.")
