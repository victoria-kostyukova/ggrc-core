# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
create attribute_object_id_nn column and fill it with values

Create Date: 2019-09-12 10:36:35.985119
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = '4285a09ebcc0'
down_revision = 'aee19c0a4205'


def get_cav_with_attribute_object_id(conn):
  """Get CAVs having attribute_object_id set."""
  sql = """
      SELECT cav.id, cav.attribute_object_id
      FROM custom_attribute_values AS cav
      WHERE cav.attribute_object_id IS NOT NULL
  """
  return conn.execute(sa.text(sql)).fetchall()


def add_attribute_object_id_nn_column(conn):
  """Add attribute_object_id_nn column to custom_attribute_values"""
  sql = """
      ALTER TABLE `custom_attribute_values`
      ADD COLUMN `attribute_object_id_nn` int(11) NOT NULL DEFAULT 0
    """
  conn.execute(sa.text(sql))


def set_values_for_attribute_object_id_nn(conn, cavs):
  """Set values for attribute_object_id_nn column"""
  for cav_id, attribute_object_id_nn in cavs:
    sql = """
        UPDATE `custom_attribute_values`
        SET `attribute_object_id_nn` = :attribute_object_id_nn
        WHERE `id` = :cav_id
    """
    conn.execute(sa.text(sql),
                 attribute_object_id_nn=attribute_object_id_nn,
                 cav_id=cav_id)


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  conn = op.get_bind()

  add_attribute_object_id_nn_column(conn)
  cavs = get_cav_with_attribute_object_id(conn)
  set_values_for_attribute_object_id_nn(conn, cavs)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
