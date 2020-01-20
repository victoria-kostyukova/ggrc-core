# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
remove asterisks from CADs and roles

Create Date: 2019-02-19 10:30:03.388132
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa

from alembic import op

from ggrc.models import all_models


# revision identifiers, used by Alembic.
revision = 'a8a44ea42a2b91'
down_revision = '7769fdc16fef'

roles_table = all_models.AccessControlRole.__tablename__
attributes_table = all_models.CustomAttributeDefinition.__tablename__

tables_descriptions = {roles_table: {'name': 'name',
                                     'object_type': 'object_type'},
                       attributes_table: {'name': 'title',
                                          'object_type': 'definition_type'}}


def update_name(element, table, connection):
  """Update fields in DB to remove symbol '*'"""
  fields = tables_descriptions[table]
  new_name = _generate_new_name(element[fields['name']],
                                element[fields['object_type']],
                                connection)
  connection.execute(sa.text("""
    UPDATE {table}
    SET {field_name} = :field_value
    WHERE id = {row_id};
  """.format(table=table,
             field_name=fields['name'],
             row_id=element.id)), field_value=new_name)


def _generate_new_name(original_name, object_type, connection):
  """Remove symbol '*' from name and add appendix if new name already exists"""
  new_name = original_name.replace('*', '')
  iterator = 0
  while is_exists(new_name, object_type, connection):
    iterator += 1
    new_name = "{}-{}".format(original_name.replace('*', ''), iterator)
  return new_name


def get_elements_to_update(connection, table):
  """Get list of all elements in table with symbol '*' in it"""
  query = """
    SELECT id, {name_field}, {object_type_field}
    FROM {table}
    WHERE {name_field} like '%*%'
  """
  if table == roles_table:
    query += "AND internal = 0;"
  else:
    query += ";"
  fields = tables_descriptions[table]
  sa_query = sa.text(query.format(table=table,
                                  name_field=fields['name'],
                                  object_type_field=fields['object_type']))
  res = connection.execute(sa_query).fetchall()
  return res


def is_exists(new_name_value, object_type, connection):
  """Check is column name with value exists in table"""
  query = """
    SELECT 1
    FROM {table_name}
    WHERE {field_name} = :name_value
    AND {object_type_field} = :object_type_value;
  """
  for table, fields in tables_descriptions.items():
    sa_query = sa.text(query.format(table_name=table,
                                    field_name=fields['name'],
                                    object_type_field=fields['object_type']))
    result = connection.execute(sa_query,
                                name_value=new_name_value,
                                object_type_value=object_type).fetchall()
    if result:
      return True
  return False


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  connection = op.get_bind()

  for table in tables_descriptions:
    elements_to_update = get_elements_to_update(connection=connection,
                                                table=table)
    for element in elements_to_update:
      update_name(element, table, connection)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
