# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Update program reader propagation ACR

Create Date: 2018-11-18 11:19:03.011372
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa

from alembic import op

from ggrc.migrations.utils import acr_propagation


# revision identifiers, used by Alembic.
revision = '05b0a3e7b4ed'
down_revision = '9beabcd92f34'


def _set_review_update(value):
  """Set update propagated permission for program readers on review object."""
  acr = acr_propagation.ACR_TABLE
  connection = op.get_bind()
  propagated_ids = connection.execute(
      sa.select([acr.c.id]).where(
          sa.and_(
              acr.c.object_type == "Review",
              acr.c.name.like("Program Readers*%")
          )
      )
  ).fetchall()

  propagated_ids = [row[0] for row in propagated_ids]

  connection.execute(
      sa.update(acr).where(
          acr.c.id.in_(propagated_ids)
      ).values(
          update=value
      )
  )


def upgrade():
  """Prevent program readers from updating reviews."""
  _set_review_update(0)


def downgrade():
  """Allow program readers from updating reviews."""
  _set_review_update(1)
