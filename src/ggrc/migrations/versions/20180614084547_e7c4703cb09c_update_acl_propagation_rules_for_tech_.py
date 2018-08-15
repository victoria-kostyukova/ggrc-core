# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""
Update ACL propagation rules for TechnologyEnvironment model

Create Date: 2018-06-14 07:52:07.341653
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from ggrc.migrations.utils import acr_propagation_constants_tech_envs \
    as tech_env_rules
from ggrc.migrations.utils import acr_propagation

# revision identifiers, used by Alembic.
revision = 'e7c4703cb09c'
down_revision = 'fdb16b4ff76c'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  acr_propagation.propagate_roles(
      tech_env_rules.GGRC_BASIC_PERMISSIONS_PROPAGATION,
      with_update=True
  )


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  for object_type, roles_tree \
          in tech_env_rules.GGRC_BASIC_PERMISSIONS_PROPAGATION.items():
    if "TechnologyEnvironment" in object_type:
      acr_propagation.remove_propagated_roles(object_type, roles_tree.keys())
