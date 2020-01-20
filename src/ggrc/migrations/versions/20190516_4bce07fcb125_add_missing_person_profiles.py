# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Add missing PersonProfiles

Create Date: 2019-05-16 13:26:33.790986
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa

from alembic import op

from ggrc.migrations import utils
from ggrc.models import person_profile

# revision identifiers, used by Alembic.
revision = '4bce07fcb125'
down_revision = 'b142aacd3e9f'


def get_people_without_profiles(conn):
  """Get people without profiles."""
  sql = """
      SELECT
          p.id
      FROM people AS p
      WHERE p.id NOT IN
          (SELECT person_id FROM people_profiles);
  """
  return conn.execute(sa.text(sql)).fetchall()


def create_missing_profile(conn, person_id, last_seen_date, modified_by_id):
  """Create missing PersonProfiles"""
  sql = """
      INSERT INTO people_profiles (
          person_id,
          last_seen_whats_new,
          updated_at,
          modified_by_id,
          created_at,
          send_calendar_events
      ) VALUES (
          :person_id,
          :last_seen_date,
          NOW(),
          :modified_by_id,
          NOW(),
          true
      );
  """
  conn.execute(
      sa.text(sql),
      person_id=person_id,
      last_seen_date=last_seen_date,
      modified_by_id=modified_by_id,
  )
  return utils.last_insert_id(conn)


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  conn = op.get_bind()
  migrator_id = utils.migrator.get_migration_user_id(conn)
  people_without_profiles = get_people_without_profiles(conn)
  profile_ids = []
  for person in people_without_profiles:
    profile_id = create_missing_profile(
        conn,
        person.id,
        person_profile.default_last_seen_date(),
        migrator_id
    )
    profile_ids.append(profile_id)

  utils.add_to_objects_without_revisions_bulk(conn, profile_ids,
                                              "PersonProfile")


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
