# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
set_cav_attribute_object_id_to_null

Create Date: 2019-05-24 16:05:16.169777
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = 'b881918e8cdc'
down_revision = '296bde07a661'


def get_cav_with_attribute_object_id(conn):
  """Get CAVs having attribute_object_id set."""
  sql = """
      SELECT
          cav.id
      FROM custom_attribute_values AS cav
          JOIN custom_attribute_definitions AS cad
          ON cav.custom_attribute_id = cad.id
      WHERE
          cad.definition_id IS NULL AND
          cav.attribute_object_id IS NOT NULL
      ;
  """
  return conn.execute(sa.text(sql)).fetchall()


def set_attribute_object_id_null(conn, cavs):
  """Set attribute_object_id for CAVs to NULL."""
  if not cavs:
    return
  sql = """
      UPDATE custom_attribute_values
      SET attribute_object_id = NULL
      WHERE id IN :ids;
  """
  conn.execute(sa.text(sql), ids=[cav.id for cav in cavs])


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  conn = op.get_bind()
  cavs = get_cav_with_attribute_object_id(conn)
  set_attribute_object_id_null(conn, cavs)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
