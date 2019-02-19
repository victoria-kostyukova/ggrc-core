# Copyright (C) 2019 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
add control default assertion if none

Create Date: 2018-12-18 08:42:29.520942
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import datetime

from alembic import op
import sqlalchemy as sa

from ggrc.migrations import utils


# revision identifiers, used by Alembic.
revision = 'f1130618060e'
down_revision = '8b0a23af6c55'


DEFAULT_ASSERTION = 'Security'

CATEGORIES_TABLE = sa.sql.table(
    "categories",
    sa.sql.column('id', sa.Integer),
    sa.sql.column('name', sa.String),
    sa.sql.column('type', sa.String),
)

CATEGORIZATIONS_TABLE = sa.sql.table(
    "categorizations",
    sa.sql.column('id', sa.Integer),
    sa.sql.column('categorizable_id', sa.Integer),
    sa.sql.column('categorizable_type', sa.String),
    sa.sql.column('category_type', sa.String),
    sa.sql.column('created_at', sa.DATETIME),
)

CONTROLS_TABLE = sa.sql.table(
    "controls",
    sa.sql.column('id', sa.Integer),
)


def get_default_assertion_id(conn):
  """Gets id of default assertion."""
  statement = sa.sql.select([CATEGORIES_TABLE.c.id]).where(
      sa.and_(CATEGORIES_TABLE.c.type == 'ControlAssertion',
              CATEGORIES_TABLE.c.name == DEFAULT_ASSERTION)
  )
  return conn.execute(statement).fetchone().id


def get_controls_without_assertion(conn):
  """Gets list of ids of controls without assertions."""
  statement = sa.sql.select([CONTROLS_TABLE.c.id]).select_from(
      CONTROLS_TABLE.outerjoin(CATEGORIZATIONS_TABLE, sa.and_(
          CATEGORIZATIONS_TABLE.c.categorizable_id == CONTROLS_TABLE.c.id,
          CATEGORIZATIONS_TABLE.c.categorizable_type == 'Control',
          CATEGORIZATIONS_TABLE.c.category_type == 'ControlAssertion'
      ))
  ).where(CATEGORIZATIONS_TABLE.c.categorizable_id.is_(None))

  control_ids = conn.execute(statement).fetchall()
  return [int(i) for i, in control_ids]


def create_default_assertions(conn, migrator_id, default_assertion_id,
                              controls_ids):
  """Creates controls default assertions and returns their ids."""
  assertions = [
      dict(
          modified_by_id=migrator_id,
          created_at=datetime.datetime.now(),
          updated_at=datetime.datetime.now(),
          category_id=default_assertion_id,
          category_type='ControlAssertion',
          categorizable_id=control_id,
          categorizable_type='Control'
      )
      for control_id in controls_ids
  ]
  op.bulk_insert(CATEGORIZATIONS_TABLE, assertions)

  statement = sa.sql.select([CATEGORIZATIONS_TABLE.c.id]).order_by(
      CATEGORIZATIONS_TABLE.c.created_at.desc()
  ).limit(len(assertions))
  assertion_ids = conn.execute(statement).fetchall()
  return [int(i) for i, in assertion_ids]


def create_revisions(conn, control_ids, assertion_ids):
  """Creates revisions for modified controls and their new assertions."""
  if control_ids and assertion_ids:

    utils.add_to_objects_without_revisions_bulk(
        conn, control_ids, 'Control', action='modified'
    )
    utils.add_to_objects_without_revisions_bulk(
        conn, assertion_ids, 'Categorization', action='created'
    )


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  conn = op.get_bind()
  migrator_id = utils.migrator.get_migration_user_id(conn)
  default_assertion_id = get_default_assertion_id(conn)
  controls_ids = get_controls_without_assertion(conn)

  if controls_ids and default_assertion_id is None:
    raise ValueError('There is no record for %s assertion in DB' %
                     DEFAULT_ASSERTION)

  if controls_ids:
    assertion_ids = create_default_assertions(
        conn, migrator_id, default_assertion_id, controls_ids
    )
    create_revisions(conn, controls_ids, assertion_ids)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  pass
