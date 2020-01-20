# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Standartize categories values

Create Date: 2019-01-30 11:03:29.157411
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa

from alembic import op


# revision identifiers, used by Alembic.
revision = '7582cfa2cf63'
down_revision = '4b53c40122a2'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  connection = op.get_bind()
  connection.execute(
      sa.text("""
          UPDATE categories
          SET name=trim(name);
          UPDATE categories
          SET name=replace(name, '/ ', '/');
          UPDATE categories
          SET name=replace(name, 'and', '&');
          UPDATE categories
          SET name='Package Verification & Code Release'
          WHERE name='Package Verification & Code release';
          UPDATE categories
          SET name='Not Applicable'
          WHERE name='Not applicable';
      """)
  )


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
