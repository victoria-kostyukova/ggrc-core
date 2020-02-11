# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Update Commentable objects flag 'send_by_default'

Create Date: 2020-01-27 11:38:52.899486
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from collections import defaultdict

import sqlalchemy as sa

from alembic import op

from ggrc.migrations import utils


# revision identifiers, used by Alembic.
revision = 'aee19c0a4205'
down_revision = 'd0f2f2dcde8d'

COMMENTABLE_MODELS_TABLES = {
    'assessments': 'Assessment',
    'cycle_task_group_object_tasks': 'CycleTaskGroupObjectTask',
    'directives': [
        'Directive',
        'Contract',
        'Policy',
        'Regulation',
        'Standard'
    ],
    'documents': 'Document',
    'evidence': 'Evidence',
    'issues': 'Issue',
    'objectives': 'Objective',
    'programs': 'Program',
    'requirements': 'Requirement',
    'threats': 'Threat'
}


def get_ids_directives(connection, table_name, type_):
  """Get ids and table object for directives table.

  Args:
    connection: "bind" to which this Session is bound.
    table_name: table name from DB.
    type_: type of objects containing in table.

  Returns:
    A tuple containing list of objects ids and table object.
  """
  table_object = sa.sql.table(
      table_name,
      sa.Column('id', sa.Integer()),
      sa.Column('send_by_default', sa.Boolean),
      sa.Column('meta_kind', sa.String)
  )
  objs = connection.execute(
      table_object.select().where(
          sa.and_(
              table_object.c.send_by_default.is_(None),
              table_object.c.meta_kind == type_
          )
      )
  ).fetchall()
  obj_ids = [obj.id for obj in objs]
  return obj_ids, table_object


def get_ids_all(connection, table_name, type_):  # noqa pylint: disable=unused-argument
  """Get ids and table object for all tables, except directives.

  Args:
    connection: "bind" to which this Session is bound.
    table_name: table name from DB.
    type_: type of objects containing in table.

  Returns:
    A tuple containing list of objects ids and table object.
  """
  table_object = sa.sql.table(
      table_name,
      sa.Column('id', sa.Integer()),
      sa.Column('send_by_default', sa.Boolean),
  )
  objs = connection.execute(
      table_object.select().where(table_object.c.send_by_default.is_(None))
  ).fetchall()
  obj_ids = [obj.id for obj in objs]
  return obj_ids, table_object

IDS_GETTERS = defaultdict(lambda: get_ids_all)
IDS_GETTERS['directives'] = get_ids_directives


def update_send_by_default_to_not_null():
  """Alter the column and default value to 1"""
  connection = op.get_bind()

  for table_name, types in COMMENTABLE_MODELS_TABLES.iteritems():
    if not isinstance(types, list):
      types = [types]
    for type_ in types:
      ids, table = IDS_GETTERS[table_name](connection, table_name, type_)
      if ids:
        connection.execute(sa.sql.update(table).where(
            table.c.id.in_(ids)).values(send_by_default='1'))
        utils.add_to_objects_without_revisions_bulk(connection, ids,
                                                    obj_type=type_,
                                                    action='modified')
    op.alter_column(table_name, 'send_by_default',
                    existing_type=sa.Boolean(), nullable=False,
                    server_default='1')


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  update_send_by_default_to_not_null()


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
