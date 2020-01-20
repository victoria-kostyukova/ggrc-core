# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
map_one_person_to_one_userrole

Create Date: 2019-06-17 14:21:10.707641
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import logging
import sqlalchemy as sa

from alembic import op


# revision identifiers, used by Alembic.
revision = '17fbb17f7cec'
down_revision = '22c80af7da75'

logger = logging.getLogger(__name__)

SYSTEM_ROLES_HIERARCHY = {
    'Administrator': 1,
    'Editor': 2,
    'Reader': 3,
    'Creator': 4,
}


def remove_duplicates(connection):
  """
  Retains highest hierarchial user role for
  user with multiple roles and deletes remaining roles.
  """
  users_with_multiple_roles = list(connection.execute(
      sa.text(
          """
          SELECT
            person_id
          FROM
            user_roles
          GROUP BY
            person_id
          HAVING
            count(id) > 1
          """))
  )

  if users_with_multiple_roles:
    logging.info(
        'Users with multiple roles:\n'
    )
  else:
    logging.info("No User with multiple roles found")
    return

  user_roles_to_be_deleted = []

  for user in users_with_multiple_roles:
    user_id = user.person_id
    user_roles = list(connection.execute(
        sa.text(
            """
            SELECT
              user_roles.person_id, user_roles.id, roles.name
            FROM
              roles
            JOIN
              user_roles
            ON roles.id = user_roles.role_id
            AND user_roles.person_id = :person_id
            """
        ), person_id=user_id)
    )
    user_roles = sorted(user_roles,
                        key=lambda x: SYSTEM_ROLES_HIERARCHY[x.name])

    logging.info('person_id={} having roles {}'.format(
        user_id,
        [role.name for role in user_roles])
    )
    user_roles_to_be_deleted.extend([role.id for role in user_roles[1:]])

  # Remove all user roles except the highest
  # hierarchial role defined for the user.
  connection.execute(
      sa.text(
          """
          DELETE FROM
            user_roles
          WHERE
            id IN :user_role_ids
          """
      ), user_role_ids=user_roles_to_be_deleted)


def add_constraint(connection):
  """Add constraint to make person_id unique in user roles table"""
  connection.execute("""
    ALTER TABLE user_roles
    ADD CONSTRAINT uq_person_id
    UNIQUE (person_id);
  """)


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  connection = op.get_bind()
  remove_duplicates(connection)
  add_constraint(connection)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
