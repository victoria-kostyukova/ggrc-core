# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Cleanup object_people out of proposal content

Create Date: 2018-11-20 16:23:05.630346
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import json
import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision = 'e2ab6a7b6524'
down_revision = '5afb1bf2e93a'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  connection = op.get_bind()
  proposals_to_cleanup = connection.execute(
      sa.text("""
              SELECT id, content
              FROM proposals
              WHERE content LIKE :proposal_content;
              """), proposal_content='%object_people%').fetchall()
  for proposal in proposals_to_cleanup:
    content = json.loads(proposal.content)
    content['mapping_list_fields'].pop('object_people', None)
    connection.execute(
        sa.text("""UPDATE proposals SET content=:content WHERE id=:id;"""),
        content=json.dumps(content), id=proposal.id)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  pass
