# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Update propagation tree for Primary and Secondary Contacts in Assessment

Create Date: 2020-01-27 11:39:42.432174
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from ggrc.migrations.utils.acr_propagation import update_acr_propagation_tree


# revision identifiers, used by Alembic.
revision = 'd0f2f2dcde8d'
down_revision = 'aee8f6a09419'


EVIDENCE_COMMENTS_PERMISSIONS = {
    "Relationship R": {
        "Evidence RUD": {
            "Relationship R": {
                "Comment R": {}
            },
        },

    },
}

NEW_ROLES_PROPAGATION = {
    "Primary Contacts": EVIDENCE_COMMENTS_PERMISSIONS,
    "Secondary Contacts": EVIDENCE_COMMENTS_PERMISSIONS,
}

CONTROL_PROPAGATION = {
    "Assessment": NEW_ROLES_PROPAGATION
}

OLD_CONTROL_PROPAGATION = {
    "Assessment": NEW_ROLES_PROPAGATION
}


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  update_acr_propagation_tree(OLD_CONTROL_PROPAGATION, CONTROL_PROPAGATION)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
