# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Fixing propagation tree for Control Operators and Control Owners

Create Date: 2019-03-11 14:01:06.461613
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from ggrc.migrations.utils.acr_propagation import update_acr_propagation_tree

# revision identifiers, used by Alembic.
revision = '0d7a3a0aa3da'
down_revision = 'e6f8ba2075a4'


CONTROL_COMMENTS_PERMISSIONS = {
    "Relationship R": {
        "Review RU": {},
        "Comment R": {},
        "Document RU": {
            "Relationship R": {
                "Comment R": {},
                "ExternalComment R": {},
            }
        },

        "Proposal RU": {},
        "ExternalComment R": {},
    },
}

NEW_ROLES_PROPAGATION = {
    "Control Operators": CONTROL_COMMENTS_PERMISSIONS,
    "Control Owners": CONTROL_COMMENTS_PERMISSIONS,
}

CONTROL_PROPAGATION = {
    "Control": NEW_ROLES_PROPAGATION
}

OLD_CONTROL_PROPAGATION = {
    "Control": NEW_ROLES_PROPAGATION
}


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  update_acr_propagation_tree(OLD_CONTROL_PROPAGATION, CONTROL_PROPAGATION)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported.")
