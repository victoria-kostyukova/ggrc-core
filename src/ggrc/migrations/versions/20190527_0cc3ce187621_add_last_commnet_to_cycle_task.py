# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
add_last_commnet_to_cycle_task

Create Date: 2019-05-27 12:31:58.281465
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op
from ggrc_workflows import models as wf_models
from ggrc.migrations.utils import with_last_comment

# revision identifiers, used by Alembic.
revision = '0cc3ce187621'
down_revision = 'b6e89c388581'

model = wf_models.CycleTaskGroupObjectTask


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  with_last_comment.add_last_comment_to_model(op=op, model=model)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
