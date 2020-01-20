# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Creator reads Program Proposals

Create Date: 2019-07-25 11:55:57.361793
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from ggrc.migrations.utils import (
    acr_propagation_constants_program_proposals as acr_constants
)
from ggrc.migrations.utils import acr_propagation


# revision identifiers, used by Alembic.
revision = 'f00343450894'
down_revision = '91d3ba424a6b'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  acr_propagation.propagate_roles(
      acr_constants.GGRC_NEW_ROLES_PROPAGATION,
      with_update=True
  )


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
