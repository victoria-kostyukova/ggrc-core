# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Evidence: update ACL propagation rules

Create Date: 2018-04-20 12:26:26.371442
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from ggrc.migrations.utils import acr_propagation_constants as prev_rules
from ggrc.migrations.utils import acr_propagation_constants_document_epic\
    as doc_epic_rules
from ggrc.migrations.utils import acr_propagation

# revision identifiers, used by Alembic.

revision = 'a90bda8e08ca'
down_revision = '3db5f2027c94'


def remove_old_rule_tree():
  """Remove old ACL propagation rules"""
  propagation = prev_rules.GGRC_BASIC_PERMISSIONS_PROPAGATION
  for object_type, roles_tree in propagation.items():
    acr_propagation.remove_propagated_roles(object_type, roles_tree.keys())


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  remove_old_rule_tree()
  acr_propagation.propagate_roles(
      doc_epic_rules.GGRC_BASIC_PERMISSIONS_PROPAGATION)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
