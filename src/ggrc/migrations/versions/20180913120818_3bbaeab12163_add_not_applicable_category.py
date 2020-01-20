# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Add Not Applicable category

Create Date: 2018-09-13 12:08:18.993560
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op

# revision identifiers, used by Alembic.
revision = '3bbaeab12163'
down_revision = '02d030db8c53'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.execute("INSERT INTO `categories` ("
             "  `created_at`, `updated_at`, `name`, `scope_id`, `type`"
             ") VALUES ( "
             "  NOW(), NOW(), \"Not applicable\", 102, \"ControlAssertion\""
             ");")


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
