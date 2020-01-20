# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
update_issuetracker_issues_due_date

Create Date: 2018-10-01 07:16:51.772866
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op


# revision identifiers, used by Alembic.
revision = 'abb4e8958464'
down_revision = '1ec05f3e6107'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  sql = """
    UPDATE issuetracker_issues
    INNER JOIN assessments
    ON issuetracker_issues.object_id = assessments.id
    AND issuetracker_issues.object_type = "Assessment"
    SET issuetracker_issues.due_date = assessments.start_date
    WHERE issuetracker_issues.due_date IS NULL
    AND assessments.start_date IS NOT NULL
  """
  op.execute(sql)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
