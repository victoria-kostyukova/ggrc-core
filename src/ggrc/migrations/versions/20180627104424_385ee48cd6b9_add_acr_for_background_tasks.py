# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Add ACR for background tasks

Create Date: 2018-06-27 10:44:24.975681
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import datetime
import sqlalchemy as sa

from alembic import op
from ggrc.migrations.utils import acr_propagation


# revision identifiers, used by Alembic.
revision = '385ee48cd6b9'
down_revision = '6bc56d6072a2'  # Last migration from ggrc workflows

ROLE_NAME = "Admin"
OBJECT_TYPE = "BackgroundTask"


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.execute(
      acr_propagation.ACR_TABLE.insert().values(
          name=ROLE_NAME,
          object_type=OBJECT_TYPE,
          parent_id=None,
          created_at=datetime.datetime.now(),
          updated_at=datetime.datetime.now(),
          internal=False,
          non_editable=True,
          read=True,
          update=True,
          delete=True,
          my_work=False,
      )
  )


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  condition = sa.and_(
      acr_propagation.ACR_TABLE.c.name == ROLE_NAME,
      acr_propagation.ACR_TABLE.c.object_type == OBJECT_TYPE,
  )
  op.execute(
      acr_propagation.ACL_TABLE.delete().where(
          acr_propagation.ACL_TABLE.c.ac_role_id.in_(
              sa.select([acr_propagation.ACR_TABLE.c.id]).where(condition)
          )
      )
  )
  op.execute(acr_propagation.ACR_TABLE.delete().where(condition))
