# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Module contains utils for WithLastComment Mixin."""

import datetime
import sqlalchemy as sa


# pylint: disable=invalid-name
def add_last_comment_to_model(op, model):
  """This function create all needed db records for WithLastComment Mixin"""
  connection = op.get_bind()
  object_templates = sa.sql.table(
      "object_templates",
      sa.sql.column("object_template_id", sa.Integer),
      sa.sql.column("object_type_id", sa.Integer),
      sa.sql.column("name", sa.Unicode),
      sa.sql.column("display_name", sa.Unicode),
      sa.sql.column("created_at", sa.DateTime),
      sa.sql.column("updated_at", sa.DateTime),
  )

  attribute_definitions = sa.sql.table(
      "attribute_definitions",
      sa.sql.column("attribute_definition_id", sa.Integer),
      sa.sql.column("attribute_type_id", sa.Integer),
      sa.sql.column("name", sa.Unicode),
      sa.sql.column("display_name", sa.Unicode),
      sa.sql.column("created_at", sa.DateTime),
      sa.sql.column("updated_at", sa.DateTime),
  )

  attribute_templates = sa.sql.table(
      "attribute_templates",
      sa.sql.column("attribute_template_id", sa.Integer),
      sa.sql.column("attribute_definition_id", sa.Integer),
      sa.sql.column("object_template_id", sa.Integer),
      sa.sql.column("order", sa.Integer),
      sa.sql.column("read_only", sa.Boolean),
      sa.sql.column("created_at", sa.DateTime),
      sa.sql.column("updated_at", sa.DateTime),
  )

  op.bulk_insert(
      object_templates,
      [{
          "object_type_id": 1,
          "name": model.__name__,
          "display_name": model.readable_name_alias,
          "created_at": datetime.datetime.now(),
          "updated_at": datetime.datetime.now(),
      }]
  )
  object_template_id = connection.execute(
      sa.select([object_templates.c.object_template_id]).order_by(
          sa.desc("object_template_id"))
  ).fetchone()[0]

  attribute_definition_id = connection.execute(
      sa.select([attribute_definitions.c.attribute_definition_id]).where(
          attribute_definitions.c.name == "last_comment")).fetchone()[0]

  op.bulk_insert(
      attribute_templates,
      [{
          "attribute_definition_id": attribute_definition_id,
          "object_template_id": object_template_id,
          "order": 1,
          "read_only": True,
          "created_at": datetime.datetime.now(),
          "updated_at": datetime.datetime.now(),
      }]
  )
