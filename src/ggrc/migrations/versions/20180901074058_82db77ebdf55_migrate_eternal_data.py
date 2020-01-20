# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Migrate external data

Create Date: 2018-09-01 07:40:58.033290
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name
import json
from alembic import op
from sqlalchemy import text
from ggrc.migrations import utils
from ggrc.migrations.utils.migrator import get_migration_user_id

revision = '82db77ebdf55'
down_revision = '210d6ec78436'

SCOPING_TABLES = [
    ("access_groups", "AccessGroup"),
    ("data_assets", "DataAsset"),
    ("facilities", "Facility"),
    ("markets", "Market"),
    ("metrics", "Metric"),
    ("org_groups", "OrgGroup"),
    ("products", "Product"),
    ("product_groups", "ProductGroup"),
    ("projects", "Project"),
    ("technology_environments", "TechnologyEnvironment"),
    ("vendors", "Vendor"),
]

EXTERNAL_DATA_TABLE = "temp_external_app_roles"


def get_object_ids(connection, table):
  """Return all ids for given table"""
  sql = "SELECT id FROM {}".format(table)
  result = connection.execute(text(sql))
  return [r.id for r in result]


def get_system_ids(connection):
  """Return all system ids"""
  sql = "SELECT id FROM systems WHERE is_biz_process=0"
  result = connection.execute(text(sql))
  return [r.id for r in result]


def get_process_ids(connection):
  """Return all process ids"""
  sql = "SELECT id FROM systems WHERE is_biz_process=1"
  result = connection.execute(text(sql))
  return [r.id for r in result]


def get_ggrc_user_id(connection, email):
  """Return user_id by email"""
  sql = "SELECT id FROM people WHERE email=:email"
  user_data = connection.execute(text(sql), email=email).fetchone()
  return user_data.id if user_data else None


def get_global_creator_role_id(connection):
  """Return Global creator role id"""
  sql = "SELECT id FROM roles WHERE name='Creator'"
  return connection.execute(text(sql)).fetchone().id


def make_creator(connection, user_id, migrator_id):
  """Grant Global Creator permissions to given user"""
  creator_role_id = get_global_creator_role_id(connection)

  sql = """
      INSERT INTO user_roles
        (person_id, role_id, modified_by_id, created_at, updated_at)
      VALUES
        (:user_id, :creator_role_id, :migrator_id, NOW(), NOW())
  """
  connection.execute(
      text(sql),
      user_id=user_id,
      creator_role_id=creator_role_id,
      migrator_id=migrator_id
  )
  user_role_id = utils.last_insert_id(connection)
  utils.add_to_objects_without_revisions(connection, user_role_id, "UserRole")


def create_ggrc_user(connection, email, name, migrator_id):
  """Create new ggrc user"""
  sql = """
      INSERT INTO people
        (email, name, created_at, updated_at, modified_by_id)
      VALUES
        (:email, :name, NOW(), NOW(), :migrator_id)
  """
  connection.execute(
      text(sql), email=email, name=name, migrator_id=migrator_id
  )
  user_id = utils.last_insert_id(connection)

  make_creator(connection, user_id, migrator_id)
  utils.add_to_objects_without_revisions(connection, user_id, "Person")
  return user_id


def get_or_create_ggrc_user(connection, external_user_data, migrator_id):
  """Return user_id if user exist else create new user and return its id"""
  if isinstance(external_user_data, basestring):
    email = json.loads(external_user_data)["email"]
    name = json.loads(external_user_data)["fullname"]
  else:
    email = external_user_data["email"]
    name = external_user_data["fullname"]
  ggrc_user_id = get_ggrc_user_id(connection, email)
  if not ggrc_user_id:

    ggrc_user_id = create_ggrc_user(connection, email, name, migrator_id)
  return ggrc_user_id


def get_acr_id(connection, object_type, role_name):
  """Return ACR id for given object/name"""
  sql = """
      SELECT id from access_control_roles
      WHERE
      object_type=:object_type and name=:role_name
  """
  return connection.execute(
      text(sql), object_type=object_type, role_name=role_name
  ).fetchone().id


# pylint: disable-msg=too-many-arguments
def add_acls(connection, object_id, object_type, role_name,
             migrator_id, user_ids):
  """Create new acl item"""

  acr_id = get_acr_id(connection, object_type, role_name)

  sql = """
      INSERT INTO access_control_list(
        person_id, ac_role_id, object_id,
        object_type, created_at, updated_at, modified_by_id
      )
      VALUES(
        :person_id, :ac_role_id, :object_id,
        :object_type, NOW(), NOW(), :migrator_id
      )
  """

  for user_id in user_ids:
    connection.execute(
        text(sql),
        person_id=user_id,
        ac_role_id=acr_id,
        object_id=object_id,
        object_type=object_type,
        migrator_id=migrator_id
    )
    acl_id = utils.last_insert_id(connection)
    utils.add_to_objects_without_revisions(
        connection, acl_id, "AccessControlList"
    )


def get_acl_user_ids(connection, object_type, object_id,
                     role_name, is_first=False):
  """Return list of user ids for given object by role name"""
  sql = """
      SELECT p.id
      FROM access_control_list acl
        JOIN people p ON p.id = acl.person_id
        JOIN access_control_roles acr ON acr.id = acl.ac_role_id
      WHERE
        acl.object_type = :object_type
        AND acl.object_id = :object_id
        AND acr.name = :role_name
      ORDER BY
        id
  """
  result = connection.execute(
      text(sql),
      object_type=object_type,
      object_id=object_id,
      role_name=role_name
  )
  if is_first:
    first = result.fetchone()
    result = [first] if first else []

  return [res.id for res in result]


def get_cc_list_user_ids(connection, cc_list_data, migrator_id):
  """Return list of user ids from cc list.

  If user not exist -> create new ggrc user.
  """
  cc_list = json.loads(cc_list_data) if cc_list_data else None
  if not cc_list:
    return []
  user_ids = []
  for cc_list_item in cc_list:
    user_ids.append(
        get_or_create_ggrc_user(connection, cc_list_item, migrator_id)
    )
  return user_ids


def merge_compliance_contacts(
    connection, object_id, object_type, cc_list_data, migrator_id
):
  """Create compliance contacts base

  Primary Contacts + Secondary Contacts + cc list
  """
  prim_contact_user_ids = get_acl_user_ids(
      connection, object_type, object_id, "Primary Contacts"
  )
  sec_contact_user_ids = get_acl_user_ids(
      connection, object_type, object_id, "Secondary Contacts"
  )
  cc_list_user_ids = get_cc_list_user_ids(
      connection, cc_list_data, migrator_id
  )

  user_ids = set(
      prim_contact_user_ids + sec_contact_user_ids + cc_list_user_ids
  )

  add_acls(
      connection, object_id, object_type, "Compliance Contacts", migrator_id,
      user_ids
  )


def is_external_service_data_available(connection):
  """Check if table exists in db"""
  sql = """
      show tables like "{}"
  """.format(EXTERNAL_DATA_TABLE)
  return connection.execute(text(sql)).fetchone()


def process_with_external_data(
    connection, object_id, object_type, external_data, migrator_id
):
  """Copy object roles based on ggrc data"""
  assignee_id = get_or_create_ggrc_user(
      connection, external_data.assignee, migrator_id
  )
  add_acls(
      connection, object_id, object_type, "Assignee", migrator_id,
      [assignee_id]
  )
  verifier_id = get_or_create_ggrc_user(
      connection, external_data.verifier, migrator_id
  )

  add_acls(
      connection, object_id, object_type, "Verifier", migrator_id,
      [verifier_id]
  )

  merge_compliance_contacts(
      connection, object_id, object_type, external_data.cc_list, migrator_id
  )


def process_with_ggrc_data(connection, object_id, object_type, migrator_id):
  """Copy object roles based on external+ggrc data"""
  admin_user_ids = get_acl_user_ids(
      connection, object_type, object_id, "Admin", is_first=True
  )
  assignee_user_ids = get_acl_user_ids(
      connection, object_type, object_id, "Assignee"
  )
  verifier_user_ids = get_acl_user_ids(
      connection, object_type, object_id, "Verifier"
  )
  prim_contact_user_ids = get_acl_user_ids(
      connection, object_type, object_id, "Primary Contacts"
  )
  sec_contact_user_ids = get_acl_user_ids(
      connection, object_type, object_id, "Secondary Contacts"
  )
  compl_contact_user_ids = get_acl_user_ids(
      connection, object_type, object_id, "Compliance Contacts"
  )
  user_ids = set(prim_contact_user_ids + sec_contact_user_ids)

  if not assignee_user_ids:
    add_acls(
        connection, object_id, object_type, "Assignee", migrator_id,
        admin_user_ids
    )
  if not verifier_user_ids:
    add_acls(
        connection, object_id, object_type, "Verifier", migrator_id,
        admin_user_ids
    )
  if not compl_contact_user_ids:
    add_acls(
        connection, object_id, object_type, "Compliance Contacts", migrator_id,
        user_ids
    )


def get_ggrc_data(connection, object_type, object_id):
  """Get external data from EXTERNAL_DATA_TABLE table"""
  if not is_external_service_data_available(connection):
    return None
  sql = """
      SELECT assignee, verifier, cc_list
      FROM {}
      WHERE object_type=:object_type AND object_id=:object_id
  """.format(EXTERNAL_DATA_TABLE)
  result = connection.execute(
      text(sql), object_type=object_type, object_id=object_id
  ).fetchone()
  return result


def update_synq_status(connection, object_id, object_type, status="OK"):
  """Set status in external_DATA_TABLE"""

  sql = """
      UPDATE temp_external_app_roles SET status=:status
      WHERE object_id=:object_id and object_type=:object_type
  """
  connection.execute(
      text(sql), object_id=object_id, object_type=object_type, status=status
  )


def process_object(connection, object_type, object_id, migrator_id):
  """Process role coping logic for single object"""
  external_data = get_ggrc_data(connection, object_type, object_id)
  if external_data:
    try:
      process_with_external_data(
          connection, object_id, object_type, external_data, migrator_id
      )
    except Exception as e:  # pylint: disable=broad-except
      update_synq_status(
          connection,
          object_id,
          object_type,
          status="Failed: {}".format(e.message)
      )
      print "Processing external data for {} ID:{} failed:{}".format(
          object_type, object_id, e.message
      )
    else:
      update_synq_status(connection, object_id, object_type, status="OK")
  else:
    process_with_ggrc_data(connection, object_id, object_type, migrator_id)

  utils.add_to_objects_without_revisions(
      connection, object_id, object_type, action="modified"
  )


def process_table(connection, object_ids, object_type, migrator_id):
  """Process role coping logic for all objects in table"""
  for object_id in object_ids:
    process_object(connection, object_type, object_id, migrator_id)


def run():
  """Run data migration"""
  connection = op.get_bind()
  migrator_id = get_migration_user_id(connection)
  for table, object_type in SCOPING_TABLES:
    print "Migrate {} objects roles with external data".format(object_type)
    object_ids = get_object_ids(connection, table)
    print "Found {} {} objects in DB".format(len(object_ids), object_type)
    process_table(connection, object_ids, object_type, migrator_id)

  # Systems
  print "Migrate System objects roles with external data"
  object_ids = get_system_ids(connection)
  print "Found {} System objects in DB".format(len(object_ids))
  process_table(connection, object_ids, "System", migrator_id)

  # Process
  print "Migrate Process objects roles with external data"
  object_ids = get_process_ids(connection)
  print "Found {} Process objects in DB".format(len(object_ids))
  process_table(connection, object_ids, "Process", migrator_id)
  if is_external_service_data_available(connection):
    sql = """SELECT t.status AS status, count(t.status) AS cnt
             FROM temp_external_app_roles AS t GROUP BY status;"""
    print "Summary status of external data:"
    result = connection.execute(text(sql))
    for row in result:
      print "{} : {}".format(row.cnt, row.status)


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  run()


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
