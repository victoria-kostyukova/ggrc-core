# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
trim spaces from slugs

Create Date: 2018-08-02 07:53:11.233962
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name, duplicate-code

from ggrc.migrations.utils.strip_text_field import \
    strip_text_field_ensure_unique

# revision identifiers, used by Alembic.

revision = '610cf459b347'
down_revision = '1d5aadd8ef75'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""

  tables_with_slug = {
      'threats', 'risk_assessments', 'risks',
  }
  strip_text_field_ensure_unique(tables_with_slug, 'slug')


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  pass
