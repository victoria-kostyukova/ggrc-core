# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Update ACL propagation rules for Metric model

Create Date: 2018-05-28 18:10:35.004368
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from ggrc.migrations.utils import acr_propagation_document_epic \
    as prev_rules
from ggrc.migrations.utils import acr_propagation_constants_metric \
    as metric_rules
from ggrc.migrations.utils import acr_propagation

# revision identifiers, used by Alembic.
revision = 'fdb16b4ff76c'
down_revision = 'f67c32c1ec20'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  from_tree = prev_rules.GGRC_BASIC_PERMISSIONS_PROPAGATION
  to_tree = metric_rules.GGRC_BASIC_PERMISSIONS_PROPAGATION
  acr_propagation.update_acr_propagation_tree(from_tree, to_tree)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  from_tree = metric_rules.GGRC_BASIC_PERMISSIONS_PROPAGATION
  to_tree = prev_rules.GGRC_BASIC_PERMISSIONS_PROPAGATION
  acr_propagation.update_acr_propagation_tree(from_tree, to_tree)
