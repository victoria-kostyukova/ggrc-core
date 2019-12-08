# Copyright (C) 2019 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Backmerge eCAVs into CAV table

Create Date: 2019-12-04 15:19:28.515525
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import logging
import sqlalchemy as sa

from alembic import op

from ggrc.migrations.utils import MIGRATION_FAILED_ERROR


logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# revision identifiers, used by Alembic.
revision = '18b61f3b870c'
down_revision = '794ec2bb70b2'


def _get_new_ids_for_migrated_ecads(conn):
  """Get newly created ids and previous_ids after ecads migration

  Args:
    conn: base mysql connection

  Returns:
      res: tuple(list(), list()) of selected ids

  """

  query = sa.text(
      """
          SELECT cad.id, cad.previous_id FROM custom_attribute_definitions
          as cad
          WHERE cad.previous_id != cad.id AND
          cad.definition_type IN ("control", "risk")
      """
  )
  ids = conn.execute(query)
  res = []
  if ids:
    res = zip(*ids)

  return res


def _get_old_ecavs_ids(conn):
  """Get IDs of for old ecav

  Args:
    conn: base mysql connection

  Returns:
      old_ids: list() of ids

  """
  query = sa.text(
      """
          SELECT ecav.id FROM external_custom_attribute_values as ecav
          JOIN custom_attribute_values as cav ON
          (cav.id = ecav.id AND cav.attributable_type IN ("control", "risk"));
      """
  )
  old_ids = [i for i, in conn.execute(query)]
  return old_ids


def _get_new_ecavs_ids(conn, ids):
  """Get IDs of newly created eCAVs

  Args:
    conn: base mysql connection
    ids: list() of ids

  Returns:
    ids: list() of selected ids

  """
  query = sa.text(
      """
          SELECT ecav.id FROM external_custom_attribute_values as ecav
          WHERE ecav.custom_attribute_id IN :ids
      """
  )
  ids = [i for i, in conn.execute(query, ids=ids)]
  return ids


def _update_old_cavs(conn, ids):
  """Update old cavs with previous id

  Args:
    conn: base mysql connection
    ids: list() of ids

  """
  query = sa.text(
      """
          UPDATE custom_attribute_values as cav
          SET cav.previous_id = cav.id
          WHERE cav.id IN :ids
      """
  )
  conn.execute(query, ids=ids)


def _migrate_new_ecav(conn, ids):
  """Update then migrate new ecavs data to CAV table

  Args:
    conn: base mysql connection
    ids: list() of ids

  """
  query = sa.text(
      """
          INSERT INTO custom_attribute_values(
              modified_by_id,
              context_id,
              created_at,
              updated_at,
              custom_attribute_id,
              attributable_type,
              attributable_id,
              attribute_value,
              previous_id)
          SELECT
              ecav.modified_by_id,
              ecav.context_id,
              ecav.created_at,
              ecav.updated_at,
              :id AS custom_attribute_id,
              ecav.attributable_type,
              ecav.attributable_id,
              ecav.attribute_value,
              :prev_id AS previous_id
          FROM external_custom_attribute_values as ecav
          WHERE ecav.id = :prev_id
      """
  )
  for _id, prev_id in ids:
    conn.execute(query, id=_id, prev_id=prev_id)


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  conn = op.get_bind()
  trans = conn.begin()

  old_ecavs_ids = _get_old_ecavs_ids(conn)
  ids = _get_new_ids_for_migrated_ecads(conn)
  new_ecav_ids = []

  if ids:
    new_cads_ids, previous_ids = ids
    new_ecav_ids = _get_new_ecavs_ids(conn, previous_ids)

  try:
    # Update old CAVs
    if old_ecavs_ids:
      _update_old_cavs(conn, old_ecavs_ids)

    # Update and Migrate eCAVs
    if ids:
      _migrate_new_ecav(conn, zip(new_cads_ids, previous_ids))

  except:
    trans.rollback()
    raise UserWarning(MIGRATION_FAILED_ERROR.format(revision))
  else:
    trans.commit()
    # pylint: disable=logging-not-lazy
    logger.info("%d cavs where updated" % len(old_ecavs_ids))
    logger.info("%d newly created ECAVs was moved to CAV table" %
                len(new_ecav_ids))


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
