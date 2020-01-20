# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Create issuetracker_issues for all Assessments

Create Date: 2018-09-17 13:08:40.593441
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa

from alembic import op

from ggrc.migrations.utils import migrator

revision = 'eabcf439ab5d'
down_revision = 'b2cdde0ea7b5'

DEFAULT_COMPONENT_ID = "188208"
DEFAULT_HOTLIST_ID = "766459"


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  connection = op.get_bind()
  migrator_id = migrator.get_migration_user_id(connection)

  max_issuetracker_id = connection.execute("""
      SELECT max(id) FROM issuetracker_issues;
  """).fetchone()[0]

  connection.execute(
      sa.text("""
          INSERT INTO issuetracker_issues(
            object_id, object_type, enabled, title, component_id,
            hotlist_id, cc_list, modified_by_id, created_at, updated_at
          )
          SELECT a.id, 'Assessment', :enabled, a.title, :component_id,
            :hotlist_id, :cc_list, :modified_by_id, NOW(), NOW()
          FROM assessments a
          LEFT JOIN issuetracker_issues ii ON ii.object_id = a.id AND
            ii.object_type = 'Assessment'
          WHERE ii.id IS NULL

          UNION ALL

          SELECT a.id, 'Audit', :enabled, a.title, :component_id,
            :hotlist_id, :cc_list, :modified_by_id, NOW(), NOW()
          FROM audits a
          LEFT JOIN issuetracker_issues ii ON ii.object_id = a.id AND
            ii.object_type = 'Audit'
          WHERE ii.id IS NULL;
      """),
      enabled=False,
      component_id=DEFAULT_COMPONENT_ID,
      hotlist_id=DEFAULT_HOTLIST_ID,
      cc_list="",
      modified_by_id=migrator_id,
  )

  connection.execute(
      sa.text("""
          INSERT IGNORE INTO objects_without_revisions(
            obj_id, obj_type, action
          )
          SELECT id, 'IssuetrackerIssue', 'created'
          FROM issuetracker_issues
          WHERE id > :max_issuetracker_id;
      """),
      max_issuetracker_id=max_issuetracker_id,
  )


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
