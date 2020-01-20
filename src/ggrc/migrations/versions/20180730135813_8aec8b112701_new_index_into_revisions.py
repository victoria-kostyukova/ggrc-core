# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
new index into revisions

Create Date: 2018-07-30 13:58:13.458058
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op

# revision identifiers, used by Alembic.
revision = '8aec8b112701'
down_revision = '262bbe790f4c'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.create_index('ix_revisions_resource_action',
                  'revisions',
                  ['resource_type', 'resource_id', 'action'],
                  unique=False)
  op.drop_index('fk_revisions_resource',
                table_name='revisions')


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  op.create_index('fk_revisions_resource',
                  'revisions',
                  ['resource_type', 'resource_id'],
                  unique=False)
  op.drop_index('ix_revisions_resource_action',
                table_name='revisions')
