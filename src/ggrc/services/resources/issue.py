# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Issue API resource optimization."""

from ggrc.services import common
from ggrc.services.resources import mixins


# pylint: disable=abstract-method
class IssueResource(mixins.SnapshotCounts, common.ExtendedResource):
  """Resource handler for issues."""
