# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
update acr table

Create Date: 2018-03-05 20:28:49.737209

"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name


from ggrc.migrations.utils import acr_propagation
from ggrc.migrations.utils import acr_propagation_constants as const

# revision identifiers, used by Alembic.
revision = '3db5f2027c94'
down_revision = '242b8dc8493b'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  acr_propagation.propagate_roles(const.GGRC_BASIC_PERMISSIONS_PROPAGATION)
  acr_propagation.remove_deprecated_roles([
      "Audit Captains Mapped",
      "Auditors Assessment Mapped",
      "Auditors Document Mapped",
      "Auditors Issue Mapped",
      "Auditors Mapped",
      "Auditors Snapshot Mapped",
      "Program Editors Mapped",
      "Program Managers Mapped",
      "Program Readers Mapped",
  ])


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  propagation = const.GGRC_BASIC_PERMISSIONS_PROPAGATION
  for object_type, roles_tree in propagation.items():
    acr_propagation.remove_propagated_roles(object_type, roles_tree.keys())
