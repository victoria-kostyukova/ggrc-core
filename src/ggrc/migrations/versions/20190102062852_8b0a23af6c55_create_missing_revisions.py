# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Create missing revisions

Create Date: 2019-01-02 06:28:52.559907
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa

from alembic import op
from ggrc.migrations import utils

# revision identifiers, used by Alembic.
revision = '8b0a23af6c55'
down_revision = '077caaf74f6b'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  connection = op.get_bind()
  models = [
      'Assessment',
      'Control',
  ]
  for model in models:
    query_sql = """
        SELECT a.id
        FROM %ss AS a
        LEFT JOIN revisions AS r
            ON r.resource_type='%s' AND r.resource_id=a.id
        WHERE r.id IS NULL
    """ % (model.lower(), model)
    objects = connection.execute(sa.text(query_sql)).fetchall()
    objects_ids = [o.id for o in objects]
    if objects_ids:
      utils.add_to_objects_without_revisions_bulk(connection, objects_ids,
                                                  model)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
