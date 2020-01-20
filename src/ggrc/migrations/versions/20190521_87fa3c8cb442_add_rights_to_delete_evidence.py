# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Add Primary and Secondary contact rights to delete evidences.

Create Date: 2019-05-21 10:25:26.853322
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from ggrc.migrations.utils import acr_propagation

# revision identifiers, used by Alembic.
revision = '87fa3c8cb442'
down_revision = 'b881918e8cdc'


EVIDENCE_RUD = {
    "Relationship R": {
        "Evidence RUD": {},
    },
}

NEW_ROLES_PROPAGATION = {
    "Primary Contacts": EVIDENCE_RUD,
    "Secondary Contacts": EVIDENCE_RUD,
}

GGRC_NEW_ROLES_PROPAGATION = {
    "Assessment": NEW_ROLES_PROPAGATION,
}


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  acr_propagation.propagate_roles(
      GGRC_NEW_ROLES_PROPAGATION,
      with_update=True
  )


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
