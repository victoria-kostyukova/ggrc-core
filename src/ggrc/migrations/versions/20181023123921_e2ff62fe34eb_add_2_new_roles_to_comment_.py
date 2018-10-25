# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Add 2 new roles to comment notifications for scoping objects

Create Date: 2018-10-23 12:39:21.763860
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa

from sqlalchemy import func
from alembic import op

from ggrc.models import all_models
from ggrc.migrations import utils

# revision identifiers, used by Alembic.
revision = 'e2ff62fe34eb'
down_revision = '348465c9e5ed'


COMMENTABLE_SCOPING_TABLES = [
    "access_groups",
    "data_assets",
    "facilities",
    "markets",
    "metrics",
    "org_groups",
    "products",
    "product_groups",
    "projects",
    "systems",
    "technology_environments",
    "vendors"
]


TABLES_MAPPINGS = {
    model.__tablename__: model.__name__ for model in all_models.all_models
    if model.__tablename__ in COMMENTABLE_SCOPING_TABLES
}


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  connection = op.get_bind()

  for name in COMMENTABLE_SCOPING_TABLES:
    commentable_table = sa.sql.table(
        name,
        sa.Column('id', sa.Integer()),
        sa.Column('recipients', sa.String(length=250))
    )

    # replace all None data with empty string for recipients field
    connection.execute(commentable_table.update()
                       .where(commentable_table.c.recipients.is_(None))
                       .values(recipients=''))

    # select all entities to update
    commentable_entities = connection.execute(
        commentable_table.select().where(commentable_table.c.recipients != '')
    ).fetchall()
    commentable_ids = [entity.id for entity in commentable_entities]

    model_name = TABLES_MAPPINGS[name]
    # add objects to objects without revisions
    if commentable_ids:
      utils.add_to_objects_without_revisions_bulk(connection, commentable_ids,
                                                  model_name)

    # add Line of Defense One Contacts, Vice President to recipients list
    op.execute(commentable_table.update()
               .where(commentable_table.c.recipients != '')
               .values(recipients=func.concat(commentable_table.c.recipients,
                                              ",Line of Defense One Contacts,"
                                              "Vice Presidents")))


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise Exception("Downgrade is not supported.")
