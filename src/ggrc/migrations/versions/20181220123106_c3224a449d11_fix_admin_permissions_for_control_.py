# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Fix admin permissions for control proposal creator

Create Date: 2018-12-20 12:31:06.991421
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa

from alembic import op

from ggrc.migrations.utils.migrator import get_migration_user_id
from ggrc.migrations.utils import fix_acl


# revision identifiers, used by Alembic.
revision = 'c3224a449d11'
down_revision = 'f0efc214e735'


def upgrade():
  """Upgrade database schema and/or data"""

  connection = op.get_bind()

  # First, allow create corresponding list records in acl table
  # when creating proposal
  connection.execute(
      sa.text("""UPDATE access_control_roles
                 SET internal = 0
                 WHERE object_type = 'Proposal' AND
                       name in ('ProposalReader', 'ProposalEditor');""")
  )

  # Second, create missing records in access_control_list table
  role_ids = list(connection.execute(
      sa.text("""
        SELECT id FROM access_control_roles
        WHERE object_type = 'Proposal' AND
              name = '{}'""".format(role_name))
  ).scalar() for role_name in ('ProposalEditor', 'ProposalReader'))
  migrator_id = get_migration_user_id(connection)
  for role_id in role_ids:
    fix_acl.create_missing_acl(connection, migrator_id, role_id, 'proposals',
                               'Proposal',
                               'created')

  # As the last step, we need give permissions to creators
  # of existing proposals. id of creator is modified_by_id of first revision
  fix_acl.create_missing_acp(connection, migrator_id,
                             'ProposalEditor',
                             'created')


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise Exception("Downgrade is not supported.")
