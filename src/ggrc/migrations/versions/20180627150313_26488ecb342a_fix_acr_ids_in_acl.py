# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Fix ACR ids in ACL.

Create Date: 2018-06-27 15:03:13.237675
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op

# revision identifiers, used by Alembic.
revision = '26488ecb342a'
down_revision = '0e385718442a'


def create_acl_temporary_table():
  """Temporary table to keep corrected ACL entries."""
  op.execute("SET AUTOCOMMIT = 1;")
  op.execute("""
      CREATE TEMPORARY TABLE updated_acl (
          id int(11) NOT NULL,
          object_id int(11) NOT NULL,
          object_type varchar(250) NOT NULL,
          ac_role_id int(11) NOT NULL,
          person_id int(11) NOT NULL,
          parent_id_nn int(11)
      );
  """)


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  create_acl_temporary_table()

  # Fix wrong ac_role_id in access_control_list only for items without
  # parent (parent_id is null). Items with parent will be fixed by
  # acl repropagation.
  # Note: this migration should not affect Workflow scope.
  op.execute("""
      INSERT INTO updated_acl (
        id, object_id, object_type, ac_role_id, person_id, parent_id_nn
      )
      SELECT acl.id, acl.object_id, acl.object_type, new_acr.id,
        acl.person_id, acl.parent_id_nn
      FROM access_control_list acl
      JOIN access_control_roles cur_acr ON acl.ac_role_id = cur_acr.id
      JOIN access_control_roles new_acr ON
        new_acr.object_type = acl.object_type
        AND cur_acr.name = new_acr.name
      WHERE acl.parent_id IS NULL AND
        acl.object_type != cur_acr.object_type AND
        cur_acr.object_type != 'Workflow';
  """)

  op.execute("""
      DELETE acl
      FROM access_control_list acl
      JOIN updated_acl ON acl.id = updated_acl.id
      LEFT JOIN access_control_list outer_acl ON
        outer_acl.object_id = updated_acl.object_id AND
        outer_acl.object_type = updated_acl.object_type AND
        outer_acl.ac_role_id = updated_acl.ac_role_id AND
        outer_acl.person_id = updated_acl.person_id AND
        outer_acl.parent_id_nn = updated_acl.parent_id_nn
      WHERE acl.parent_id IS NULL AND outer_acl.id IS NOT NULL;
  """)

  op.execute("""
      UPDATE access_control_list acl
      JOIN updated_acl ON acl.id = updated_acl.id
      LEFT JOIN access_control_list outer_acl ON
        outer_acl.object_id = updated_acl.object_id AND
        outer_acl.object_type = updated_acl.object_type AND
        outer_acl.ac_role_id = updated_acl.ac_role_id AND
        outer_acl.person_id = updated_acl.person_id AND
        outer_acl.parent_id_nn = updated_acl.parent_id_nn
      SET acl.ac_role_id = updated_acl.ac_role_id
      WHERE acl.parent_id IS NULL AND outer_acl.id IS NULL;
  """)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
