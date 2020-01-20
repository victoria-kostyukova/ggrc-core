# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
# pylint: disable=invalid-name,missing-docstring

"""
Create table for saved_searches

Create Date: 2019-04-04 11:51:24.725598
"""

import sqlalchemy as sa

from alembic import op


revision = "a9c71728dd5f"
down_revision = "f68d49c6e2c4"


def upgrade():
  op.create_table(
      "saved_searches",
      sa.Column("id", sa.Integer, nullable=False),
      sa.Column("name", sa.String(250), nullable=False),
      sa.Column("query", sa.Text, nullable=False),
      sa.Column("object_type", sa.String(250), nullable=False),
      sa.Column("created_at", sa.DateTime(), nullable=False),
      sa.Column("person_id", sa.Integer, nullable=False),

      sa.PrimaryKeyConstraint("id"),
  )
  op.create_foreign_key(
      "fk_saved_search_person",
      "saved_searches",
      "people",
      ["person_id"], ["id"],
      ondelete="CASCADE",
  )
  op.create_unique_constraint(
      "unique_pair_saved_search_name_person_id",
      "saved_searches",
      ["name", "person_id"],
  )
  op.create_index(
      "saved_search_object_type_index",
      "saved_searches",
      ["object_type"],
  )


def downgrade():
  op.drop_table("saved_searches")
