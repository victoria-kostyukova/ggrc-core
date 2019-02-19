# Copyright (C) 2019 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Convert Cotrol Categories intro string attributes

Create Date: 2019-02-13 09:18:57.762311
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa

from alembic import op


# revision identifiers, used by Alembic.
revision = 'a6554e0b1bf4'
down_revision = '49e1b804c32f'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.add_column(
      "controls",
      sa.Column("assertions", sa.String(1024), nullable=True)
  )
  op.add_column(
      "controls",
      sa.Column("categories", sa.String(1024), nullable=True)
  )

  op.execute("""SET SESSION group_concat_max_len = 10000;""")

  op.execute("""
      UPDATE controls c1,
            (
              SELECT c.id,
                     CONCAT(
                        '["', GROUP_CONCAT(ctg.name SEPARATOR '", "'), '"]'
                     ) assertions
              FROM controls c
              JOIN categorizations ctz ON ctz.categorizable_id = c.id AND
                ctz.categorizable_type = 'Control'
              JOIN categories ctg ON ctg.id = ctz.category_id  AND
                ctz.category_type = ctg.type
              WHERE ctg.type = 'ControlAssertion'
              GROUP BY c.id
            ) tmp
      SET c1.assertions = tmp.assertions
      WHERE c1.id = tmp.id;
  """)

  op.execute("""
      UPDATE controls c1,
            (
              SELECT c.id,
                     CONCAT(
                        '["', GROUP_CONCAT(ctg.name SEPARATOR '", "'), '"]'
                     ) categories
              FROM controls c
              JOIN categorizations ctz ON ctz.categorizable_id = c.id AND
                ctz.categorizable_type = 'Control'
              JOIN categories ctg ON ctg.id = ctz.category_id AND
                ctz.category_type = ctg.type
              WHERE ctg.type = 'ControlCategory'
              GROUP BY c.id
            ) tmp
      SET c1.categories = tmp.categories
      WHERE c1.id = tmp.id;
  """)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
