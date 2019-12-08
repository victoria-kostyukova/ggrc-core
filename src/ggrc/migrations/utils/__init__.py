# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Migrations Utility Module.

Place here your migration helpers that is shared among number of migrations.

"""

from collections import namedtuple

from sqlalchemy import text, Integer, String, inspect
from sqlalchemy.sql import and_, table, column
from sqlalchemy.sql import func
from sqlalchemy.sql import select
from sqlalchemy.sql import tuple_

from ggrc.models.relationship import Relationship
from ggrc.models.revision import Revision
from ggrc.models.snapshot import Snapshot
from ggrc.migrations.utils.migrator import get_migration_user_id


relationships_table = Relationship.__table__  # pylint: disable=invalid-name
revisions_table = Revision.__table__  # pylint: disable=invalid-name
snapshots_table = Snapshot.__table__  # pylint: disable=invalid-name


Stub = namedtuple("Stub", ["type", "id"])

_USE_DEFAULT_MIGRATOR = object()
MIGRATION_FAILED_ERROR = "Migration {} was failed"


def get_relationships(connection, type_, id_, filter_types=None):
  """Get all relationships of individual object"""
  if not filter_types:
    relationships = select([relationships_table]).where(and_(
        relationships_table.c.source_type == type_,
        relationships_table.c.source_id == id_,
    )).union(
        select([relationships_table]).where(and_(
            relationships_table.c.destination_type == type_,
            relationships_table.c.destination_id == id_,
        ))
    )
  else:
    relationships = select([relationships_table]).where(and_(
        relationships_table.c.source_type == type_,
        relationships_table.c.source_id == id_,
        relationships_table.c.destination_type.in_(filter_types)
    )
    ).union(
        select([relationships_table]).where(and_(
            relationships_table.c.destination_type == type_,
            relationships_table.c.destination_id == id_,
            relationships_table.c.source_type.in_(filter_types)
        ))
    )

  relationships_ = connection.execute(relationships)
  related = set()
  for obj in relationships_:
    if obj.source_type == type_ and obj.source_id == id_:
      child = Stub(obj.destination_type, obj.destination_id)
    else:
      child = Stub(obj.source_type, obj.source_id)
    related.add(child)
  return related


def get_relationship_cache(connection, type_, filter_types=None):
  """Get all relationships of specified object type.

  For "Program", it will build a cache of all relationships of all
  programs."""
  if not filter_types:
    relationships = select([relationships_table]).where(and_(
        relationships_table.c.source_type == type_,
    )).union(
        select([relationships_table]).where(and_(
            relationships_table.c.destination_type == type_,
        ))
    )
  else:
    relationships = select([relationships_table]).where(and_(
        relationships_table.c.source_type == type_,
        relationships_table.c.destination_type.in_(filter_types)
    )
    ).union(
        select([relationships_table]).where(and_(
            relationships_table.c.destination_type == type_,
            relationships_table.c.source_type.in_(filter_types)
        ))
    )

  relationships_ = connection.execute(relationships)
  from collections import defaultdict
  cache = defaultdict(set)
  for obj in relationships_:
    if obj.source_type == type_:
      source = Stub(obj.source_type, obj.source_id)
      target = Stub(obj.destination_type, obj.destination_id)
    else:
      source = Stub(obj.destination_type, obj.destination_id)
      target = Stub(obj.source_type, obj.source_id)
    cache[source].add(target)
  return cache


def get_revisions(connection, objects):
  """Get latest revisions of provided objects."""
  revisions = select([
      func.max(revisions_table.c.id),
      revisions_table.c.resource_type,
      revisions_table.c.resource_id,
  ]).where(
      tuple_(
          revisions_table.c.resource_type,
          revisions_table.c.resource_id).in_(objects)
  ).group_by(revisions_table.c.resource_type, revisions_table.c.resource_id)
  revisions_ = {
      Stub(rtype, rid): id_ for id_, rtype, rid in
      connection.execute(revisions).fetchall()
  }
  return revisions_


def insert_payloads(connection, snapshots=None, relationships=None):
  """Bulk insert snapshot and relationship payloads and create applicable
  revisions."""
  # pylint: disable=not-a-mapping
  # snap and rel variables show a false not a mapping warning

  if snapshots:
    sql = """INSERT IGNORE INTO snapshots (
          parent_id,
          parent_type,
          child_id,
          child_type,
          revision_id,
          modified_by_id,
          context_id,
          created_at,
          updated_at
        )
        VALUES """
    value_ = ("({parent_id}, '{parent_type}', {child_id}, '{child_type}', "
              "{revision_id}, {modified_by_id}, {context_id}, now(), now())")
    sql += ','.join(value_.format(**snap) for snap in snapshots)
    connection.execute(sql)

  if relationships:
    sql = """INSERT IGNORE INTO relationships (
          source_id,
          source_type,
          destination_id,
          destination_type,
          modified_by_id,
          context_id,
          created_at,
          updated_at
        )
        VALUES """
    value_ = ("({source_id}, '{source_type}', {destination_id}, "
              "'{destination_type}', {modified_by_id}, {context_id}, now(), "
              "now())")
    sql += ','.join(value_.format(**rel) for rel in relationships)
    connection.execute(sql)


def last_insert_id(connection):
  """Returns last inserted id"""
  return connection.execute(text('select LAST_INSERT_ID()')).fetchone()[0]


# pylint: disable=invalid-name
def _check_modified_by_id_column_exists(connection):
  """Return True if column modified_by_id exists"""

  schema_name = inspect(connection).default_schema_name

  sql = """
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'objects_without_revisions' AND
                column_name = 'modified_by_id' AND
                table_schema = :current_schema
  """

  result = connection.execute(text(sql), current_schema=schema_name)
  return True if result.scalar() else False


# pylint: disable=invalid-name
def add_to_objects_without_revisions(connection, obj_id,
                                     obj_type, action='created',
                                     modified_by_id=_USE_DEFAULT_MIGRATOR):
  """Add object to objects_without_revisions table"""

  add_to_objects_without_revisions_bulk(connection, [obj_id], obj_type,
                                        action, modified_by_id)


# pylint: disable=invalid-name
def add_to_objects_without_revisions_bulk(
    connection,
    obj_ids,
    obj_type,
    action='created',
    modified_by_id=_USE_DEFAULT_MIGRATOR
):
  """Add object to objects_without_revisions table bulk"""

  rev_table = table('objects_without_revisions',
                    column('obj_id', Integer),
                    column('obj_type', String),
                    column('action', String))

  if not _check_modified_by_id_column_exists(connection):
    # This function is called by older migrations, which don't expect
    # that column modified_by_id exists
    data = [{'obj_id': obj_id,
             'obj_type': obj_type,
             'action': action} for obj_id in obj_ids]
  else:
    rev_table.append_column(column('modified_by_id', Integer))

    if modified_by_id is _USE_DEFAULT_MIGRATOR:
      modified_by_id = get_migration_user_id(connection)
    data = [{'obj_id': obj_id,
             'obj_type': obj_type,
             'action': action,
             'modified_by_id': modified_by_id} for obj_id in obj_ids]

  connection.execute(rev_table.insert().prefix_with('IGNORE'), data)


def clean_new_revisions(connection):
  """Clean objects_without_revisions table"""
  connection.execute(text("truncate objects_without_revisions"))


def create_event(connection, user_id, resource_type,
                 action='BULK'):
  """Create event. Can be used for creating revisions in migrations"""
  sql = """
      INSERT INTO events (
          modified_by_id,
          created_at,
          action,
          resource_type,
          updated_at)
      VALUES (:user_id, NOW(), :action, :resource_type, NOW());
  """
  connection.execute(text(sql),
                     action=action, resource_type=resource_type,
                     user_id=user_id)
  return last_insert_id(connection)


# pylint: disable=too-many-arguments
def create_revision(connection, slug, doc_id, content, event_id,
                    resource_type, action, migrator_id):
  """Create revision"""
  sql = """
      INSERT INTO revisions (
        resource_id,
        resource_type,
        event_id,
        action,
        content,
        created_at,
        updated_at,
        modified_by_id,
        resource_slug
      )
      VALUES (
        :resource_id,
        :resource_type,
        :event_id,
        :action,
        :content,
        NOW(),
        NOW(),
        :modified_by_id,
        :resource_slug
      )
  """
  connection.execute(
      text(sql),
      resource_id=doc_id,
      resource_type=resource_type,
      event_id=event_id,
      action=action,
      content=content,
      modified_by_id=migrator_id,
      resource_slug=slug
  )
