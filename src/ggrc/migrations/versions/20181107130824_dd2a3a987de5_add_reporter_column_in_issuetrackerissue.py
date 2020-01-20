# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Add 'reporter' column in IssueTrackerIssue

Create Date: 2018-11-07 13:08:24.722869
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = 'dd2a3a987de5'
down_revision = '6b56f3091f7c'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.add_column(
      'issuetracker_issues',
      sa.Column(
          'reporter',
          sa.String(length=250),
          nullable=True
      )
  )


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  op.drop_column('issuetracker_issues', 'reporter')
