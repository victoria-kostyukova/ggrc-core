# Copyright (C) 2019 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Extend CustomAttributeDefinition table with previous_id, external_name column

Create Date: 2019-10-25 17:06:53.631035
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa

from alembic import op

from ggrc.models import all_models


# revision identifiers, used by Alembic.
revision = 'd793fa1c1930'
down_revision = 'e91e309a7b27'

table_name = all_models.CustomAttributeDefinition.__tablename__


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.add_column(table_name, sa.Column('previous_id', sa.Integer,
                                      autoincrement=False, nullable=True))
  op.add_column(table_name, sa.Column('external_name', sa.String(255),
                                      nullable=True))


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
