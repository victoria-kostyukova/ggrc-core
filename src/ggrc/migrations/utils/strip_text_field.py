# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Strip trailing spaces from text field

This helper is used by the following migrations:

* ggrc.migrations.versions.20161220124319_5891fb9375a1
* ggrc_risks.versions.20161221095515_4f82fc47b28e
* ggrc_workflows.versions.20161221095734_445ecfd7dee7
"""

from alembic import op
from sqlalchemy.sql import text


def strip_spaces_ensure_uniq(tables, field, uniq_tables):
  """Strip trailing spaces from text field and ensure uniqueness."""
  connection = op.get_bind()
  for table in tables:
    records = connection.execute(
        'SELECT {0}.id as id, {0}.{1} as value FROM {0}'.format(table, field)
    )
    records = {record.id: record.value for record in records}
    uniq_values = set(records.values())
    for rec_id, rec_value in records.iteritems():
      stripped_value = rec_value if rec_value is None else rec_value.strip()
      if stripped_value != rec_value:
        new_value = stripped_value
        if table in uniq_tables:
          index = 1
          while new_value in uniq_values:
            new_value = '{} ({})'.format(stripped_value, index)
            index += 1
          uniq_values.add(new_value)
        connection.execute(
            text(
                'UPDATE {} SET {} = :val WHERE id = :id'.format(table, field)
            ),
            val=new_value,
            id=rec_id
        )


def get_unique_value(value, existing_values):
  """Create new value if the current value exist."""
  index = 1
  new_value = value
  while new_value in existing_values:
    new_value = '{}-{}'.format(value, index)
    index += 1
  return new_value


def get_queries_for_stripping(table_name, field, records, unique):
  """Create list of queries for stripping whitespaces from values."""
  queries = []
  unique_values = set(records.values())
  records = {rec_id: rec_value for (rec_id, rec_value)
             in records.items() if rec_value}
  for rec_id, rec_value in records.iteritems():
    new_value = rec_value.strip()
    if new_value == rec_value:
      continue
    if unique:
      new_value = get_unique_value(new_value, unique_values)
    unique_values.add(new_value)
    queries.append(
        {
            'text': 'UPDATE {} SET {} = :val WHERE id = :id'.format(
                table_name, field
            ),
            'val': new_value,
            'id': rec_id
        }
    )
  # reverse needed to avoid errors when unique_table
  # contains some values like this ' data', 'data '.
  # e.g. if we try out put stripped value 'data' in table
  # we will got mysql error "Duplicate entry 'data' for key..."
  # because mysql varchar 'data ' is equal 'data'.
  queries.reverse()
  return queries


def strip_text_field_ensure_unique(tables, field, unique_tables=None):
  """Strip trailing spaces from text field and ensure uniqueness."""
  if unique_tables is None:
    unique_tables = tables
  connection = op.get_bind()
  for table in tables:
    records = connection.execute(
        'SELECT {table}.id as id, {table}.{field} as value '
        'FROM {table}'.format(table=table, field=field)
    )
    records = {record.id: record.value for record in records}
    queries = get_queries_for_stripping(table, field, records,
                                        table in unique_tables)
    for query in queries:
      connection.execute(text(query['text']), val=query['val'], id=query['id'])
