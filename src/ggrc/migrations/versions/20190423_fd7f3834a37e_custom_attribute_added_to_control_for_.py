# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Custom Attribute added to Control for Control Narrative

Create Date: 2019-04-23 14:05:52.999307
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name


from alembic import op
from ggrc.migrations.utils.custom_attributes import create_custom_attribute

revision = 'fd7f3834a37e'
down_revision = '2dd5e1292b9c'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  connection = op.get_bind()
  create_custom_attribute(connection, 'Control Narrative',
                          'Rich Text', 'control')
  create_custom_attribute(connection, 'Operating Procedure',
                          'Rich Text', 'control')


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
