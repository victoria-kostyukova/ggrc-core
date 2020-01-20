# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Set create/read permission to comments for TaskAssignees
and TaskSecondaryAssignees

Create Date: 2019-01-08 12:32:21.910959
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from ggrc.migrations.utils.acr_propagation import propagate_roles


# revision identifiers, used by Alembic.
revision = '4b53c40122a2'
down_revision = 'f1130618060e'


TASK_ASSIGNEES_PERMISSION = {
    "CycleTaskGroupObjectTask": {
        "Task Assignees": {
            "Relationship R": {
                "Comment R": {}
            }
        },
        "Task Secondary Assignees": {
            "Relationship R": {
                "Comment R": {}
            }
        }
    }
}


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  propagate_roles(TASK_ASSIGNEES_PERMISSION, with_update=True)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise Exception("Downgrade is not supported.")
