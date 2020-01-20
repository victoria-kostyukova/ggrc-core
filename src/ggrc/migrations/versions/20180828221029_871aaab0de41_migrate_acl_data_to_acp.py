# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Migrate ACL data to ACP

Create Date: 2018-08-28 22:10:29.423282
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa
from sqlalchemy.dialects import mysql
from alembic import op


# revision identifiers, used by Alembic.
revision = '871aaab0de41'
down_revision = '65b65cb7e57c'


acl = sa.sql.table(
    "access_control_list",
    sa.sql.column('id', sa.Integer),
    sa.sql.column('person_id', sa.Integer),
    sa.sql.column('ac_role_id', sa.Integer),
    sa.sql.column('object_type', sa.Integer),
    sa.sql.column('object_id', sa.Integer),
    sa.sql.column('parent_id', sa.Integer),
    sa.sql.column('created_at', sa.DateTime),
    sa.sql.column('updated_at', sa.DateTime),
)

acp = sa.sql.table(
    "access_control_people",
    sa.sql.column('id', sa.Integer),
    sa.sql.column('person_id', sa.Integer),
    sa.sql.column('ac_list_id', sa.Integer),
    sa.sql.column('created_at', sa.DateTime),
    sa.sql.column('updated_at', sa.DateTime),
)


ACL_COPY_STEP = 1000


def _replace_old_indexes():
  """Remove and replace old indexes.

  Since we're removing people from access control list table we must first
  remove all indexes that reference that column.
  """
  # the following index is needed for faster data migration from acl to acp
  print "create role-object index"
  op.create_index(
      'ix_role_object',
      'access_control_list',
      ['ac_role_id', 'object_type', 'object_id'],
      unique=False
  )
  print "drop person-object index"
  op.drop_index('ix_person_object', table_name='access_control_list')
  op.drop_constraint(
      u'access_control_list_ibfk_3',
      'access_control_list',
      type_='foreignkey',
  )
  print "drop access control list index"
  op.drop_index('uq_access_control_list', table_name='access_control_list')


def _create_new_indexes():
  op.execute("""
      ALTER TABLE access_control_list
      ADD CONSTRAINT uq_access_control_list
      UNIQUE (ac_role_id, object_id, object_type, parent_id_nn)
  """)


def _remove_person_id():
  op.drop_column('access_control_list', 'person_id')


def _add_person_id():
  """Add person id column for downgrade migration.

  The nullable flag here is set to true so we can do the data migration,
  but after data is migrated and cleaned up, we set it back to false.
  """
  op.add_column(
      'access_control_list',
      sa.Column(
          'person_id',
          mysql.INTEGER(display_width=11),
          autoincrement=False,
          nullable=True,
      )
  )


def _remove_propagated_entries():
  print "remove propagated entries"
  op.execute(acl.delete().where(acl.c.parent_id.isnot(None)))


def _get_max_acl_id():
  """Get maximum acl id or 0 if there aren't any acl entries."""
  connection = op.get_bind()
  count = connection.execute(
      "Select max(id) from access_control_list"
  ).fetchall()
  return count[0][0] or 0


def _insert_acp_entries():
  """
  select statement for inserting into access_control_people table:

    select acl1.*, min(acl2.id)
    from access_control_list as acl1
    left join access_control_list as acl2 on
      acl1.ac_role_id = acl2.ac_role_id and
      acl1.object_type = acl2.object_type and
      acl1.object_id = acl2.object_id and
    group by acl1.id;
  """

  print "insert access control people entries"
  acl1 = acl.alias("acl1")
  acl2 = acl.alias("acl2")

  max_acl_id = _get_max_acl_id()

  for index in range(0, max_acl_id + 1, ACL_COPY_STEP):
    print "handle acls from {} to {} of {}".format(
        index,
        index + ACL_COPY_STEP,
        max_acl_id,
    )

    select_statement = sa.select([
        acl1.c.id.label("id"),
        acl1.c.person_id.label("person_id"),
        sa.func.min(acl2.c.id).label("ac_list_id"),
        acl1.c.created_at.label("created_at"),
        acl1.c.updated_at.label("updated_at"),
    ]).select_from(
        sa.join(
            acl1,
            acl2,
            sa.and_(
                acl1.c.ac_role_id == acl2.c.ac_role_id,
                acl1.c.object_type == acl2.c.object_type,
                acl1.c.object_id == acl2.c.object_id,
            )
        )
    ).where(
        sa.and_(
            acl1.c.id >= index,
            acl1.c.id < (index + ACL_COPY_STEP),
        )
    ).group_by(acl1.c.id)

    op.execute(
        acp.insert().from_select(
            [
                acp.c.id,
                acp.c.person_id,
                acp.c.ac_list_id,
                acp.c.created_at,
                acp.c.updated_at,
            ],
            select_statement
        )
    )


def _delete_redundant_acl_entries():
  print "delete redundant acl entries"
  op.execute(
      acl.delete().where(
          ~acl.c.id.in_(sa.select([acp.c.ac_list_id]))
      )
  )


def _migrate_data_to_acp():
  """Move entries from ACL table to ACP table."""
  _remove_propagated_entries()
  _insert_acp_entries()
  _delete_redundant_acl_entries()


def _migrate_data_from_acp():
  """Migrate data from ACP to ACL.

  This function is only used for verification that migrate and downgrade do not
  lose any data.
  """
  op.execute("""
      insert into access_control_list (
          ac_role_id,
          person_id,
          object_id,
          object_type,
          created_at,
          modified_by_id,
          updated_at,
          context_id,
          parent_id,
          parent_id_nn,
          base_id
      )
      select
          acl.ac_role_id,
          acp.person_id,
          acl.object_id,
          acl.object_type,
          acl.created_at,
          acl.modified_by_id,
          acl.updated_at,
          acl.context_id,
          acl.parent_id,
          acl.parent_id_nn,
          acl.base_id
      from access_control_list as acl
      join access_control_people as acp on
          acl.id = acp.ac_list_id
  """)
  op.execute("truncate table access_control_people")
  op.execute("update access_control_list set base_id = id")
  op.execute("delete from access_control_list where person_id is null")


def _drop_new_indexes():
  """Downgrade table indexes back to old schema."""
  op.drop_constraint('uq_access_control_list', 'access_control_list',
                     type_='unique')
  op.drop_index('ix_role_object', table_name='access_control_list')


def _create_old_indexes():
  """Create indexes for the downgrade migration."""
  op.create_foreign_key(
      u'access_control_list_ibfk_3', 'access_control_list', 'people',
      ['person_id'], ['id']
  )
  op.create_index(
      'uq_access_control_list',
      'access_control_list',
      ['person_id', 'ac_role_id', 'object_id', 'object_type', 'parent_id_nn'],
      unique=True,
  )
  op.create_index(
      'ix_person_object',
      'access_control_list', ['person_id', 'object_type', 'object_id'],
      unique=False,
  )


def _set_person_id_non_null():
  """Set person column to not nullable."""
  op.alter_column(
      'access_control_list',
      'person_id',
      type_=sa.Integer,
      nullable=True,
  )


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  _replace_old_indexes()
  _migrate_data_to_acp()
  _create_new_indexes()
  _remove_person_id()


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  _add_person_id()
  _drop_new_indexes()
  _migrate_data_from_acp()
  _set_person_id_non_null()
  _create_old_indexes()
