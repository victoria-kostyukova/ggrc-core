# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Rename roles for Control

Create Date: 2018-11-21 12:03:34.260255
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import datetime

import sqlalchemy as sa
from sqlalchemy import func
from alembic import op

from ggrc.migrations import utils
from ggrc.migrations.utils.acr_propagation import propagate_roles
from ggrc.migrations.utils import migrator

# revision identifiers, used by Alembic.
revision = 'b494ed20d04d'
down_revision = 'e2ab6a7b6524'


ROLE_MAPPING = {
    "Primary Contacts": "Control Operators",
    "Secondary Contacts": "Control Owners"
}


CONTROL_COMMENTS_PERMISSIONS = {
    "Relationship R": {
        "Comment R": {},
        "Document RU": {
            "Relationship R": {
                "Comment R": {},
            }
        },
    },
}

NEW_ROLES_PROPAGATION = {
    "Control Operators": CONTROL_COMMENTS_PERMISSIONS,
    "Control Owners": CONTROL_COMMENTS_PERMISSIONS,
}

CONTROL_PROPAGATION = {
    "Control": NEW_ROLES_PROPAGATION
}


def update_recipients(connection, migrator_id):
  """Updates recipients field for Control model. """
  control_table = sa.sql.table(
      "controls",
      sa.Column('id', sa.Integer(), nullable=False),
      sa.Column('recipients', sa.String(length=250), nullable=True),
      sa.Column('updated_at', sa.DateTime, nullable=False),
      sa.Column('modified_by_id', sa.Integer, nullable=True)
  )

  # replace all None data with empty string for recipients field
  for old_role_name, new_role_name in ROLE_MAPPING.iteritems():
    connection.execute(control_table.update().values(
        recipients=func.replace(control_table.c.recipients,
                                old_role_name, new_role_name),
        updated_at=datetime.datetime.utcnow(),
        modified_by_id=migrator_id
    ))
  control_entities = connection.execute(
      control_table.select().where(control_table.c.recipients != '')
  ).fetchall()

  if control_entities:
    control_ids = [entity.id for entity in control_entities]
    utils.add_to_objects_without_revisions_bulk(connection, control_ids,
                                                "Control", action="modified")


def update_role_names(connection, migrator_id):
  """Updates role names for Control model. """
  roles_table = sa.sql.table(
      "access_control_roles",
      sa.Column('object_type', sa.String(length=250), nullable=False),
      sa.Column('name', sa.String(length=250), nullable=False),
      sa.Column('updated_at', sa.DateTime, nullable=False),
      sa.Column('modified_by_id', sa.Integer, nullable=True)
  )

  for old_role_name, new_role_name in ROLE_MAPPING.iteritems():
    connection.execute(
        roles_table.update().where(
            roles_table.c.object_type == "Control"
        ).where(
            roles_table.c.name == old_role_name
        ).values(name=new_role_name,
                 updated_at=datetime.datetime.utcnow(),
                 modified_by_id=migrator_id)
    )


def update_templates_definitions(connection, migrator_id):
  """Updates assessment templates default_people value."""
  template_table = sa.sql.table(
      "assessment_templates",
      sa.Column('id', sa.Integer(), nullable=False),
      sa.Column('template_object_type', sa.String(length=250), nullable=True),
      sa.Column('default_people', sa.Text(), nullable=False),
      sa.Column('updated_at', sa.DateTime, nullable=False),
      sa.Column('modified_by_id', sa.Integer, nullable=True)
  )

  template_entities = connection.execute(
      template_table.select().where(
          template_table.c.template_object_type == "Control"
      ).where(template_table.c.default_people.ilike("%Primary Contacts%") |
              template_table.c.default_people.ilike("%Secondary Contacts%"))
  ).fetchall()

  if template_entities:
    for old_role_name, new_role_name in ROLE_MAPPING.iteritems():
      connection.execute(template_table.update().where(
          template_table.c.template_object_type == "Control"
      ).values(
          default_people=func.replace(
              template_table.c.default_people, old_role_name, new_role_name
          ),
          updated_at=datetime.datetime.utcnow(),
          modified_by_id=migrator_id
      ))

  if template_entities:
    template_ids = [entity.id for entity in template_entities]
    utils.add_to_objects_without_revisions_bulk(
        connection, template_ids, "AssessmentTemplate", action="modified"
    )


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  connection = op.get_bind()
  migrator_id = migrator.get_migration_user_id(connection)
  update_recipients(connection, migrator_id)
  update_role_names(connection, migrator_id)
  propagate_roles(CONTROL_PROPAGATION, with_update=True)
  update_templates_definitions(connection, migrator_id)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
