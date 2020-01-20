# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Set due_date for Fixed and Depricated Issues

Create Date: 2019-04-12 15:18:33.419112
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import json

import sqlalchemy as sa

from alembic import op

from ggrc.migrations import utils

# revision identifiers, used by Alembic.
revision = '84c5ff059f75'
down_revision = 'bba307188ef6'


# We need to create a migration for existing issues in statuses Fixed,
# Fixed and verified and Deprecated to the date when this revision with
# was created. All other statuses - empty.

STATUSES = ("Fixed", "Fixed and Verified", "Deprecated")


def get_issues_without_due_date(connection):
  """Fin Issues where we need to set due_date value"""
  query = "SELECT id FROM issues WHERE status IN :statuses AND " \
          "due_date IS null"
  return connection.execute(sa.text(query), statuses=STATUSES).fetchall()


def get_revision_due_date(con, issue_id):
  """Fund due_date value in related revision"""
  query = "SELECT content, created_at FROM revisions WHERE " \
          "resource_type = 'Issue' AND resource_id = :id " \
          "ORDER BY id DESC"
  all_revisions = con.execute(sa.text(query), id=issue_id)
  result = None
  last_status = None
  for rev in all_revisions:
    if not result:
      last_status = json.loads(rev['content'])['status']
    elif json.loads(rev['content'])['status'] != last_status:
      break
    result = rev['created_at']
  return result


def set_due_date(con, issue_id, due_date):
  query = sa.text("UPDATE issues SET due_date = :due_date WHERE id = :id")
  con.execute(query, due_date=due_date, id=issue_id)


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  connection = op.get_bind()
  issues_for_update = get_issues_without_due_date(connection)
  issues_ids = [issue['id'] for issue in issues_for_update]
  for issue_id in issues_ids:
    due_date = get_revision_due_date(connection, issue_id)
    set_due_date(connection, issue_id, due_date)
  utils.add_to_objects_without_revisions_bulk(connection, issues_ids, "Issue",
                                              "modified")


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
