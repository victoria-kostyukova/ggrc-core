# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>


"""Entry point for all acl handlers.

This package should have the single hook that should handle all acl propagation
and deletion.
"""

import logging

import sqlalchemy as sa

from ggrc import db
from ggrc.models import all_models
from ggrc import utils

logger = logging.getLogger(__name__)

# retry count for possible deadlock issues.
PROPAGATION_RETRIES = 10


def insert_select_acls(select_statement):
  """Insert acl records from the select statement
  Args:
    select_statement: sql statement that contains the following columns
      ac_role_id,
      object_id,
      object_type,
      created_at,
      modified_by_id,
      updated_at,
      parent_id,
      parent_id_nn,
      base_id,
  """

  acl_table = all_models.AccessControlList.__table__
  inserter = acl_table.insert().prefix_with("IGNORE")

  to_insert = db.session.execute(select_statement).fetchall()

  if to_insert:
    # TODO: investigate whether the select above sets locks on any tables
    db.session.plain_commit()

  def to_dict(record):
    """Match selected and inserted columns."""
    return dict(
        zip(
            [
                'ac_role_id',
                'object_id',
                'object_type',
                'created_at',
                'modified_by_id',
                'updated_at',
                'parent_id',
                'parent_id_nn',
                'base_id',
            ],
            record,
        ),
    )

  # process to_insert in chunks, retry failed inserts, allow maximum of
  # PROPAGATION_RETRIES total retries
  failures = 0
  for chunk in utils.list_chunks(to_insert, chunk_size=10000):
    inserted_successfully = False
    while not inserted_successfully:
      try:
        db.session.execute(
            inserter,
            [to_dict(record) for record in chunk],
        )
        db.session.plain_commit()
      except sa.exc.OperationalError as error:
        failures += 1
        if failures == PROPAGATION_RETRIES:
          logger.critical(
              "ACL propagation failed with %d retries on statement: \n %s",
              failures,
              select_statement,
          )
          raise
        logger.exception(error)
      else:
        inserted_successfully = True
