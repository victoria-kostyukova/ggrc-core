# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Change format of fraud_related/key_control fields for existing proposals

Create Date: 2019-01-03 15:13:22.987617
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import json
import sqlalchemy as sa
from alembic import op

from ggrc.migrations import utils

# revision identifiers, used by Alembic.
revision = '077caaf74f6b'
down_revision = '26d983e69d78'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  connection = op.get_bind()
  proposals_to_update = connection.execute(
      sa.text("""
          SELECT id, content
          FROM proposals
          WHERE instance_type='Control'
          AND content LIKE '%key_control%'
          OR content LIKE'%fraud_related%';
          """)).fetchall()
  ids = []
  for proposal in proposals_to_update:
    ids.append(proposal.id)
    content = json.loads(proposal.content)
    # modify values for `key_control`
    if 'key_control' in content['fields']:
      if content['fields']['key_control'] == '1':
        content['fields']['key_control'] = True
      elif content['fields']['key_control'] == '0':
        content['fields']['key_control'] = False

    # modify values for `fraud_related`
    if 'fraud_related' in content['fields']:
      if content['fields']['fraud_related'] == '1':
        content['fields']['fraud_related'] = True
      elif content['fields']['fraud_related'] == '0':
        content['fields']['fraud_related'] = False

    connection.execute(
        sa.text("""UPDATE proposals SET content=:content WHERE id=:id;"""),
        content=json.dumps(content), id=proposal.id)

  utils.add_to_objects_without_revisions_bulk(
      connection, ids, "Proposal", action="modified",
  )


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  pass
