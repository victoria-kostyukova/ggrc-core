# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Update ACR Rules for ProductGroup object.

Create Date: 2018-07-04 15:01:04.612300
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from ggrc.migrations.utils import acr_propagation_constants_product_groups \
    as product_group_rules
from ggrc.migrations.utils import acr_propagation


# revision identifiers, used by Alembic.
revision = '786774c00050'
down_revision = 'e7c4703cb09c'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  acr_propagation.propagate_roles(
      product_group_rules.GGRC_BASIC_PERMISSIONS_PROPAGATION,
      with_update=True
  )


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  for object_type, roles_tree \
          in product_group_rules.GGRC_BASIC_PERMISSIONS_PROPAGATION.items():
    if "ProductGroup" in object_type:
      acr_propagation.remove_propagated_roles(object_type, roles_tree.keys())
