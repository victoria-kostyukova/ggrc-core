# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Update Commentable objects flag 'send_by_default'

Create Date: 2020-01-27 11:38:52.899486
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa

from alembic import op

from ggrc.migrations import utils
from ggrc.models import all_models


# revision identifiers, used by Alembic.
revision = 'aee19c0a4205'
down_revision = 'd0f2f2dcde8d'


def update_send_by_default_to_not_null():
  """Alter the column and default value to 1"""
  connection = op.get_bind()
  commentable_tables_models = set(model for model in all_models.all_models)

  for model in commentable_tables_models:
    if 'send_by_default' in model.__table__.columns:
      op.alter_column(model.__tablename__, 'send_by_default',
                      existing_type=sa.Boolean(), nullable=False,
                      server_default='1')
      table_object = sa.sql.table(
          model.__tablename__,
          sa.Column('send_by_default', sa.Boolean),
      )

      objs = connection.execute(
          table_object.select().where(table_object.c.send_by_default.is_(None))
      ).fetchall()
      obj_ids = [obj.id for obj in objs]
      if obj_ids:
        connection.execute(sa.sql.update(table_object).where(
            table_object.c.id.in_(obj_ids)).values(send_by_default='1'))

        utils.add_to_objects_without_revisions_bulk(connection, obj_ids,
                                                    obj_type=model.type,
                                                    action='modified')


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  update_send_by_default_to_not_null()


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
