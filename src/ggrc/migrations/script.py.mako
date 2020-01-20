# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
${message}

Create Date: ${create_date}
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa

from alembic import op
${imports if imports else ""}

# revision identifiers, used by Alembic.
revision = ${repr(up_revision)}
down_revision = ${repr(down_revision)}


def upgrade():
    """Upgrade database schema and/or data, creating a new revision."""
    ${upgrades if upgrades else ""}

def downgrade():
    """Downgrade database schema and/or data back to the previous revision."""
    raise NotImplementedError("Downgrade is not supported")
