# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Add missing acp revisions

Create Date: 2019-09-04 20:09:31.848954
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op
import sqlalchemy as sa

from ggrc.migrations import utils


# revision identifiers, used by Alembic.
revision = '007ee00ff963'
down_revision = '0f827fe39ad5'


def get_acp_without_revision(connection):
  """Get all acps without revisions."""
  sql = """
      SELECT * FROM access_control_people
       WHERE id NOT IN (
        SELECT resource_id FROM revisions
         WHERE resource_type = "AccessControlPerson")
  """
  acps = list(connection.execute(sa.text(sql)))
  return acps


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  connection = op.get_bind()
  acps = get_acp_without_revision(connection)
  acps_ids = [acp.id for acp in acps]
  utils.add_to_objects_without_revisions_bulk(connection,
                                              acps_ids,
                                              'AccessControlPerson')


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
