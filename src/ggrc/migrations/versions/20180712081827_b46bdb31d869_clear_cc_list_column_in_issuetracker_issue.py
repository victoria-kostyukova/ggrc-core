# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
clear cc_list column in issuetracker_table

Create Date: 2018-07-12 08:18:27.269755
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op

from ggrc.migrations import utils

# revision identifiers, used by Alembic.
revision = 'b46bdb31d869'
down_revision = 'fe3ce1807a4e'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  connection = op.get_bind()

  bugs = connection.execute(
      'SELECT isi.id, isi.cc_list, GROUP_CONCAT(p.email) '
      'AS auditors '
      'FROM access_control_list acl '
      'INNER JOIN access_control_roles acr ON acr.id = acl.ac_role_id '
      'INNER JOIN assessments asmt ON asmt.audit_id = acl.object_id '
      'INNER JOIN people p ON p.id = acl.person_id '
      'INNER JOIN issuetracker_issues isi ON asmt.id = isi.object_id '
      'WHERE acr.name = "Auditors" AND isi.object_type = "Assessment" '
      'AND isi.cc_list != "" '
      'GROUP BY isi.id, isi.cc_list '
      'HAVING auditors != ""'
  ).fetchall()

  update_bugs = {}
  for bug_id, cc_list, auditors in bugs:
    auditors = set(auditor.strip() for auditor in auditors.split(','))
    emails = set(cc_list.split(','))
    new_emails = set(email for email in emails if email not in auditors)

    if emails != new_emails:
      cc_list = ','.join(new_emails)
      update_bugs[bug_id] = cc_list

  if update_bugs:
    for bug_id, cc_list in update_bugs.items():
      op.execute('UPDATE issuetracker_issues isi SET isi.cc_list = "{}" '
                 'WHERE isi.id = {}'.format(cc_list, bug_id))

    utils.add_to_objects_without_revisions_bulk(
        connection, update_bugs.keys(), 'IssuetrackerIssue', 'modified'
    )


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
