# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
trim spaces from slugs

Create Date: 2018-08-02 07:32:38.652046
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name, duplicate-code

from ggrc.migrations.utils.strip_text_field import \
    strip_text_field_ensure_unique


# revision identifiers, used by Alembic.
revision = 'c17f5f1f273e'
down_revision = '96b11a5760ee'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""

  tables_with_slug = {
      'cycle_task_groups', 'workflows', 'cycle_task_group_object_tasks',
      'task_group_tasks', 'task_groups', 'cycles',
  }
  strip_text_field_ensure_unique(tables_with_slug, 'slug')


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  pass
