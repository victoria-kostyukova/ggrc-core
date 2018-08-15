# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Update ACR for scoping objects

Create Date: 2018-08-07 07:38:23.372003
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from ggrc.migrations.utils import acr_propagation_constants_scoping_objects \
    as scoping_objects_rules
from ggrc.migrations.utils import acr_propagation

# revision identifiers, used by Alembic.
revision = '6c41e3ad0a43'
down_revision = '50b90430fb62'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  acr_propagation.propagate_roles(
      scoping_objects_rules.GGRC_PROPAGATION,
      with_update=True
  )


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  for object_type, roles_tree in \
          scoping_objects_rules.GGRC_PROPAGATION.items():
    acr_propagation.remove_propagated_roles(object_type, roles_tree.keys())
