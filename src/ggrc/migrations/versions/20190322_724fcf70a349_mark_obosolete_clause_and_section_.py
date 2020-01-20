# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Mark obosolete clause and section revisions

Create Date: 2019-03-22 13:04:30.260668
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op


# revision identifiers, used by Alembic.
revision = '724fcf70a349'
down_revision = '42ac8162b810'


def upgrade():
  """Mark clause and section objects in revisions.

  This migration just marks old revisions for clauses and section with
  -obsolete postfix so that they are not accessible through our app. Those
  revisions of objects that do not exist could cause errors if they are pulled
  to the front-end.
  """
  op.execute("""
    UPDATE revisions SET
      resource_type = concat(resource_type, "-obsolete"),
      source_type = concat(source_type, "-obsolete"),
      destination_type = concat(destination_type, "-obsolete")
    WHERE
      resource_type in ("Clause", "Section") OR
      source_type in ("Clause", "Section") OR
      destination_type in ("Clause", "Section")
  """)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  op.execute("""
    UPDATE revisions SET
      resource_type = SUBSTRING(
        resource_type,
        1,
        CHAR_LENGTH(resource_type) - CHAR_LENGTH("-obsolete")
      ),
      source_type = SUBSTRING(
        source_type,
        1,
        CHAR_LENGTH(source_type) - CHAR_LENGTH("-obsolete")
      ),
      destination_type = SUBSTRING(
        destination_type,
        1,
        CHAR_LENGTH(destination_type) - CHAR_LENGTH("-obsolete")
      )
    WHERE
      resource_type in ("Clause-obsolete", "Section-obsolete") OR
      source_type in ("Clause-obsolete", "Section-obsolete") OR
      destination_type in ("Clause-obsolete", "Section-obsolete")
  """)
