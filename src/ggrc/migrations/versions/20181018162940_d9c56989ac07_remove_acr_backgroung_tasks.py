# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Remove ACR for background tasks. Alter column background_tasks.name

Create Date: 2018-10-18 16:29:40.409113
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa

from sqlalchemy.dialects import mysql
from alembic import op

from ggrc.models.types import CompressedType
from ggrc.migrations.utils import acr_propagation


# revision identifiers, used by Alembic.
revision = "d9c56989ac07"
down_revision = "05b0a3e7b4ed"

ROLE_NAME = "Admin"
OBJECT_TYPE = "BackgroundTask"


def remove_acp_acl_acr_of_bg_tasks():
  """Remove ACL and ACR related to BackgroundTask objects"""
  condition = sa.and_(
      acr_propagation.ACR_TABLE.c.name == ROLE_NAME,
      acr_propagation.ACR_TABLE.c.object_type == OBJECT_TYPE,
  )
  acl_join_acr = sa.join(
      acr_propagation.ACL_TABLE,
      acr_propagation.ACR_TABLE,
      acr_propagation.ACL_TABLE.c.ac_role_id == acr_propagation.ACR_TABLE.c.id
  )
  delete_acp = acr_propagation.ACP_TABLE.delete().where(
      acr_propagation.ACP_TABLE.c.ac_list_id.in_(
          sa.select([acr_propagation.ACL_TABLE.c.id], condition, acl_join_acr)
      )
  )
  delete_acl = acr_propagation.ACL_TABLE.delete().where(
      acr_propagation.ACL_TABLE.c.ac_role_id.in_(
          sa.select([acr_propagation.ACR_TABLE.c.id], condition)
      )
  )
  delete_acr = acr_propagation.ACR_TABLE.delete().where(condition)

  op.execute(delete_acp)
  op.execute(delete_acl)
  op.execute(delete_acr)


def alter_name_column():
  """Populate null and add unique constraint to 'name' column"""
  sql = """
      UPDATE background_tasks b
      SET b.name = UUID()
      WHERE b.name is null
  """
  op.execute(sql)

  sql = """
      UPDATE background_tasks b1
      JOIN background_tasks b2
      ON b1.name = b2.name AND b1.id > b2.id
      SET b1.name = CONCAT(UUID(), "_", b1.name)
  """
  op.execute(sql)

  op.alter_column(
      "background_tasks",
      "name",
      existing_type=mysql.VARCHAR(length=250),
      nullable=False
  )
  op.create_unique_constraint("uq_background_tasks_name",
                              "background_tasks", ["name"])


def add_payload_column():
  """Add 'payload' column to BackgroundTask"""
  op.add_column(
      "background_tasks",
      sa.Column("payload",
                CompressedType(length=16777215),
                nullable=True)
  )


def upgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  remove_acp_acl_acr_of_bg_tasks()
  alter_name_column()
  add_payload_column()


def downgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  raise Exception("Downgrade is not supported.")
