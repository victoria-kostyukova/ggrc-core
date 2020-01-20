# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Add Payments RMA Review CAD for Control

Create Date: 2019-07-29 20:54:12.643551
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op

from ggrc.migrations.utils import custom_attributes as cad_utils


# revision identifiers, used by Alembic.
revision = 'e732f578fa85'
down_revision = '17fbb17f7cec'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  connection = op.get_bind()
  cad_utils.create_custom_attribute(
      connection,
      name='Payments RMA Review',
      attribute_type='Date',
      for_object='control',
  )


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
