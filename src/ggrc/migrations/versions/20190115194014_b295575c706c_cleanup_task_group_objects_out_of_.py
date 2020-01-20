# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Cleanup task_group_objects out of proposal content

Create Date: 2019-01-15 19:40:14.258501
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name
import json

import sqlalchemy as sa
from alembic import op

from ggrc.migrations import utils
# revision identifiers, used by Alembic.
revision = 'b295575c706c'
down_revision = '44f601715634'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  connection = op.get_bind()
  proposals_to_cleanup = connection.execute(
      sa.text("""
              SELECT id, content
              FROM proposals
              WHERE content LIKE :proposal_content;
              """), proposal_content='%task_group_objects%').fetchall()
  ids = []
  for proposal in proposals_to_cleanup:
    ids.append(proposal.id)
    content = json.loads(proposal.content)
    content['mapping_list_fields'].pop('task_group_objects', None)
    connection.execute(
        sa.text("""UPDATE proposals SET content=:content WHERE id=:id;"""),
        content=json.dumps(content), id=proposal.id)
  if ids:
    utils.add_to_objects_without_revisions_bulk(
        connection, ids, "Proposal", action="modified")


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
