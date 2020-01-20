# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
evidence delete for assignees

Create Date: 2019-02-20 15:32:06.145839
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from ggrc.migrations.utils.acr_propagation import propagate_roles


# revision identifiers, used by Alembic.
revision = "53e115488aec"
down_revision = "7d10655e87f9"


ASMT_EVIDENCE_PERMISSIONS = {
    "Audit": {
        "Auditors": {
            "Relationship R": {
                "Assessment RU": {
                    "Relationship R": {
                        "Evidence RUD": {},
                    },
                },
            },
        },
    },
    "Assessment": {
        "Assignees": {
            "Relationship R": {
                "Evidence RUD": {},
            },
        },
        "Creators": {
            "Relationship R": {
                "Evidence RUD": {},
            },
        },
        "Verifiers": {
            "Relationship R": {
                "Evidence RUD": {},
            },
        },
    },
}


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  propagate_roles(ASMT_EVIDENCE_PERMISSIONS, with_update=True)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
