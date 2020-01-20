# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Set readonly permissions to audit evidence for auditor

Create Date: 2018-10-23 13:24:10.838296
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from ggrc.migrations.utils.acr_propagation import propagate_roles


# revision identifiers, used by Alembic.
revision = '70e734fea4a4'
down_revision = 'b9e9cb977292'


AUDITOR_PERMISSIONS = {
    'Audit': {
        'Auditors': {
            'Relationship R': {
                'Evidence R': {}
            }
        }
    }
}


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  propagate_roles(AUDITOR_PERMISSIONS, with_update=True)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
