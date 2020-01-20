# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Module contains utils for external CAVs."""

import sqlalchemy as sa

from ggrc.migrations import utils

CAVS_BY_OBJECT_TYPE_SQL = u'''
  SELECT
    custom_attribute_id,
    attributable_type,
    attributable_id,
    attribute_value,
    context_id,
    updated_at,
    modified_by_id,
    created_at
  FROM
    custom_attribute_values
  WHERE
    attributable_type = :object_type
'''

PROPAGATE_EXTERNAL_CAVS_BY_CAVS_SQL = u'''
  INSERT INTO external_custom_attribute_values (
    custom_attribute_id,
    attributable_type,
    attributable_id,
    attribute_value,
    context_id,
    updated_at,
    modified_by_id,
    created_at
  ) VALUES (
    :custom_attribute_id,
    :attributable_type,
    :attributable_id,
    :attribute_value,
    :context_id,
    :updated_at,
    :modified_by_id,
    :created_at
  )
'''

EXTERNAL_CAV_IDS_BY_TYPE = u'''
  SELECT id
  FROM external_custom_attribute_values
  WHERE attributable_type = :object_type
'''


def _get_cavs(connection, object_type):
  """Returns CAVs by object type.
  Args:
    connection: sqlalchemy.engine.Connection object.
  Returns:
    cavs: List of CAVs objects.
  """
  cavs = connection.execute(
      sa.text(CAVS_BY_OBJECT_TYPE_SQL),
      object_type=object_type
  ).fetchall()

  return cavs


def _get_external_cav_ids(connection, object_type):
  """Returns CAVs ids by object type.

  Args:
    connection: sqlalchemy.engine.Connection object.
    object_type: String representation of object type.
  Returns:
    List of CAVs ids
  """
  cavs = connection.execute(
      sa.text(EXTERNAL_CAV_IDS_BY_TYPE),
      object_type=object_type
  ).fetchall()

  return [cav.id for cav in cavs]


def _propagate_external_cavs(connection, cavs):
  """Propagates external CAVs by CAVs.
  Args:
    connection: sqlalchemy.engine.Connection object.
    cavs: List of CAVs objects.
  """
  for cav in cavs:
    connection.execute(
        sa.text(PROPAGATE_EXTERNAL_CAVS_BY_CAVS_SQL),
        cav
    )


def _add_revisions(connection, obj_type):
  """Adds CAVs to objects without revisions.

  Args:
    connection: sqlalchemy.engine.Connection object.
    obj_type: String representation of object type.
  """
  cav_ids = _get_external_cav_ids(connection, obj_type)
  utils.add_to_objects_without_revisions_bulk(
      connection,
      cav_ids,
      "ExternalCustomAttributeValue",
      "created"
  )


def _add_object_revisions(connection, cavs, obj_type):
  """Adds CAVs related objects to objects without revisions.

  Args:
    connection: sqlalchemy.engine.Connection object.
    obj_type: String representation of object type.
    cavs: List of CAVs objects.
  """
  obj_ids = set(cav.attributable_id for cav in cavs)
  utils.add_to_objects_without_revisions_bulk(
      connection,
      obj_ids,
      obj_type.title(),
      "modified"
  )


def migrate_to_external_cavs(connection, obj_type):
  """Migrates CAVs to external CAVs.

  Args:
    connection: An instance of SQLAlchemy connection.
    obj_type: String representation of object type.
  """
  cavs = _get_cavs(connection, obj_type)
  _propagate_external_cavs(connection, cavs)
  _add_revisions(connection, obj_type)
  _add_object_revisions(connection, cavs, obj_type)
