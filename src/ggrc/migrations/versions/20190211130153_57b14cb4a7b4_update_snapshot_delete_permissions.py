# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Update Snapshot delete permissions

Create Date: 2019-02-11 13:01:53.767454
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name, too-many-lines

from ggrc.migrations.utils.acr_propagation import propagate_roles

# revision identifiers, used by Alembic.
revision = '57b14cb4a7b4'
down_revision = '59b41fe6c145'


UPDATED_PERMISSIONS = {
    "Audit": {
        "Audit Captains": {  # RUD
            "Relationship R": {
                "Assessment RUD": {
                    "Relationship R": {
                        "Comment R": {
                        },
                        "Evidence RU": {
                            "Relationship R": {
                                "Comment R": {
                                },
                            },
                        },
                    },
                },
                "AssessmentTemplate RUD": {
                },
                "Evidence RU": {
                    "Relationship R": {
                        "Comment R": {
                        },
                    },
                },
                "Issue RUD": {
                    "Relationship R": {
                        "Comment R": {
                        },
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {
                                },
                            },
                        },
                    },
                },
                "Snapshot RUD": {  # CHANGED
                },
            },
        },
    },
}


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  propagate_roles(UPDATED_PERMISSIONS, with_update=True)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise Exception("Downgrade is not supported.")
