# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Set default values for Audit's empty Issue Tracker fields.

Create Date: 2018-12-22 08:43:39.454986
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = '26d983e69d78'
down_revision = 'dd2a3a987de5'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""

  connection = op.get_bind()
  changed_issues = connection.execute("""
      SELECT id
      FROM issuetracker_issues
      WHERE object_type = "Audit"
            AND (issue_priority IS NULL OR issue_severity IS NULL);
  """).fetchall()
  issues_list = [issue[0] for issue in changed_issues]
  op.execute("""
      UPDATE issuetracker_issues
      SET issue_priority = 'P2'
      WHERE object_type = "Audit" AND (issue_priority IS NULL)
  """)

  op.execute("""
      UPDATE issuetracker_issues
      SET issue_severity = 'S2'
      WHERE object_type = "Audit" AND (issue_severity IS NULL)
  """)

  if changed_issues:
    connection.execute(
        sa.text("""
            INSERT IGNORE INTO objects_without_revisions(
                obj_id, obj_type, action
            )
            SELECT id, 'IssuetrackerIssue', 'modified'
            FROM issuetracker_issues
            WHERE id IN :changed_issues;
        """),
        changed_issues=issues_list,
    )


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
