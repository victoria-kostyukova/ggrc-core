# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Document epic ACL rules update

Create Date: 2018-05-31 07:39:05.302869
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from ggrc.migrations.utils import acr_propagation_constants_evidence_comments \
    as prev_rules
from ggrc.migrations.utils import acr_propagation_document_epic \
    as doc_epic_rules
from ggrc.migrations.utils import acr_propagation

# revision identifiers, used by Alembic.
revision = 'f67c32c1ec20'
down_revision = 'e2605be7b288'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  old_rules = prev_rules.GGRC_BASIC_PERMISSIONS_PROPAGATION
  new_rules = doc_epic_rules.GGRC_BASIC_PERMISSIONS_PROPAGATION
  acr_propagation.update_acr_propagation_tree(old_rules, new_rules)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision.

  To downgrade you need first to downgrade ggrc_risks
  1) alembic ggrc_risks downgrade -1
  """
  old_rules = doc_epic_rules.GGRC_BASIC_PERMISSIONS_PROPAGATION
  new_rules = prev_rules.GGRC_BASIC_PERMISSIONS_PROPAGATION
  acr_propagation.update_acr_propagation_tree(old_rules, new_rules)
