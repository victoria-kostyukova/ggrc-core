# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Functions to fix data related to ACL"""


import sqlalchemy as sa


# pylint: disable=too-many-arguments
def create_missing_acl(connection, migration_user_id, role_id,
                       table_name, object_type, revision_action):
  """Insert into access_control_list record for missing role

  If we have 'create' revision -> take modified_by_id as Admin
  else set current migration user to modified_by_id

  If there are multiple 'create' revisions, take each distinct modified_by_id,
  because there is no way of knowing which of the duplicate revisions
  is correct.

  Args:
    connection: SQLAlchemy connection object;
    migration_user_id: the id of Migrator user (used as a default Admin);
    role_id: ACR.id of the correct role;
    table_name: name of the table with ids of objects with no Admins;
    object_type: string name of object type processed (e.g. 'Document');
    revision_action: the value for Revision.action field (e.g. 'created').
  """
  sql = """
      INSERT INTO access_control_list (
        ac_role_id,
        object_id,
        object_type,
        created_at,
        modified_by_id,
        updated_at)
      SELECT
        :admin_role_id,
        twoa.id as object_id,
        :object_type,
        NOW(),
        :migration_user_id,
        NOW()
      FROM {table_mame} twoa
        LEFT OUTER JOIN revisions r ON
          r.resource_id=twoa.id
          AND r.resource_type=:object_type
          AND r.action=:revision_action
      GROUP BY object_id
  """.format(table_mame=table_name)
  connection.execute(
      sa.text(sql),
      migration_user_id=migration_user_id,
      admin_role_id=role_id,
      object_type=object_type,
      revision_action=revision_action,
  )


# pylint: disable=too-many-arguments
def create_missing_acp(connection, migrator_id, role_name, revision_action):
  """Insert into access_control_people record for missing Admin role

  If we have 'create' revision -> take modified_by_id as Admin
  else set current migration user to modified_by_id

  If there are multiple 'create' revisions, take each distinct modified_by_id,
  because there is no way of knowing which of the duplicate revisions
  is correct.

  Args:
    connection: SQLAlchemy connection object;
    migrator_id: the id of Migrator user (used as a default Admin);
    role_name: ACR.name of the Admin role;
    revision_action: the value for Revision.action field (e.g. 'created').
  """
  sql = """
      INSERT INTO access_control_people (
        person_id,
        ac_list_id,
        updated_at,
        modified_by_id,
        created_at)
      SELECT
        IF(r.modified_by_id is NOT NULL, r.modified_by_id,
          :migrator_id) as person_id,
        acl.id AS ac_list_id,
        NOW() AS updated_at,
        :migrator_id AS modified_by_id,
        NOW() AS created_at
      FROM access_control_list acl
        LEFT OUTER JOIN revisions r ON
          r.resource_type = acl.object_type AND
          r.resource_id = acl.object_id
        LEFT OUTER JOIN access_control_roles acr ON
          acr.id = acl.ac_role_id
      WHERE r.action = 'created' AND
            acr.name = :admin_role_name
  """
  connection.execute(
      sa.text(sql),
      migrator_id=migrator_id,
      admin_role_name=role_name,
      revision_action=revision_action,
  )
