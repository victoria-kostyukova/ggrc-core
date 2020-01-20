# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Add (type, property) index on fulltext_record_properties

Create Date: 2019-04-17 12:00:00.633277
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op


# revision identifiers, used by Alembic.
revision = '2168ca30ae3b'
down_revision = 'f911d14458c5'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.execute("""
      CREATE INDEX ix_fulltext_record_properties_type_property
          ON fulltext_record_properties (type, property)
  """)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  op.execute("""
      DROP INDEX ix_fulltext_record_properties_type_property
          ON fulltext_record_properties
  """)
