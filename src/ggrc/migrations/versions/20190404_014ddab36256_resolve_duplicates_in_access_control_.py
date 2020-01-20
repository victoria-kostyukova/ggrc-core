# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Resolve duplicates in access_control_people

Create Date: 2019-04-04 09:11:21.904685
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import logging
import sqlalchemy as sa

from alembic import op


# revision identifiers, used by Alembic.
revision = '014ddab36256'
down_revision = 'adf7bdb8996e'


logger = logging.getLogger(__name__)


def remove_duplicates(connection):
  """Remove duplicates from table if any"""

  # Get list of duplicated IDs fto be removed:
  # inner SELECT returns MIN IDs (i.e. original ones,
  # for which duplicates exist)
  # outer SELECT returns ID which are duplicates (i.e. exclude original ones)
  dup_items = list(connection.execute(
      sa.text(
          """
          SELECT
              acp.id, acp.person_id, acp.ac_list_id
          FROM
              access_control_people acp
                  JOIN
              (SELECT
                  MIN(acp1.id) AS id,
                      acp1.person_id AS person_id,
                      acp1.ac_list_id AS ac_list_id
              FROM
                  access_control_people acp1
              GROUP BY acp1.person_id , acp1.ac_list_id
              HAVING COUNT(*) > 1) acp2 ON acp.person_id = acp2.person_id
                  AND acp.ac_list_id = acp2.ac_list_id
          WHERE
              acp.id != acp2.id
          """))
  )

  if dup_items:
    logging.warning(
        '[rev:%s] Duplicated items:\n%s', revision,
        '\n'.join('id={} person_id={} ac_list_id={}'.format(
            i.id, i.person_id, i.ac_list_id
        ) for i in dup_items)
    )
  else:
    logging.warning("[rev:%s] No duplicated items found", revision)
    return

  dup_ids = list(i.id for i in dup_items)

  # Remove duplicated
  connection.execute(
      sa.text("DELETE FROM access_control_people WHERE id IN :orig_ids"),
      orig_ids=dup_ids
  )


def add_constraint(connection):
  """Add constraint to make person_id/ac_list_id pair unique in DB"""
  connection.execute("""
    ALTER TABLE access_control_people
    ADD CONSTRAINT uq_access_control_people
    UNIQUE (person_id, ac_list_id);
  """)


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""

  connection = op.get_bind()

  remove_duplicates(connection)
  add_constraint(connection)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
