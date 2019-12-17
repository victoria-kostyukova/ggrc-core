# Copyright (C) 2019 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
add_ext_mappings_records

Create Date: 2019-12-07 10:41:48.084931
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import datetime
import logging
import sqlalchemy as sa

from alembic import op


# revision identifiers, used by Alembic.

revision = '55984900c508'
down_revision = '18b61f3b870c'


logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

DATE_NOW = datetime.datetime.utcnow().replace(microsecond=0).isoformat()


def _get_count_of_ids_for_mapping(conn):
  """Count ids for mappings records

  Args:
    conn: base mysql connection

  Returns:
      Count of related records
  """

  query = sa.text(
      """ SELECT COUNT(*) FROM(
            SELECT DISTINCT ecav.id
              FROM external_custom_attribute_definitions as ecav
              JOIN custom_attribute_definitions as cav
              WHERE (cav.id = ecav.id OR cav.previous_id = ecav.id)
              AND ecav.external_id IS NOT NULL
          ) AS count_1
      """
  )
  count = conn.execute(query).fetchone()
  return count[0]


def _add_mappings_records(conn):
  """Fill External_mappings table

  Args:
    conn: base mysql connection

  """
  query = sa.text(
      """
          INSERT INTO external_mappings(
              object_type,
              external_type,
              object_id,
              external_id,
              created_at)
          SELECT DISTINCT
              "CustomAttributeDefinition" AS object_type,
              "CustomAttribute" AS external_type,
              ecav.id,
              ecav.external_id,
              :date_time
          FROM external_custom_attribute_definitions as ecav
          JOIN custom_attribute_definitions as cav
          WHERE (cav.id = ecav.id OR cav.previous_id = ecav.id)
          AND ecav.external_id IS NOT NULL
      """
  )
  conn.execute(query, date_time=DATE_NOW)


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  conn = op.get_bind()
  ids_count = _get_count_of_ids_for_mapping(conn)

  if ids_count:
    _add_mappings_records(conn)

  # pylint: disable=logging-not-lazy
  logger.info("%d mapper records where created " % ids_count)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
