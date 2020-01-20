# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Snapshot counts API resource."""


class SnapshotCounts(object):
  # pylint: disable=too-few-public-methods
  """Extends resource with snapshot_counts."""

  def get(self, *args, **kwargs):
    """snapshot_counts endpoint handler"""
    # pylint: disable=arguments-differ
    command = kwargs.get("command", None)
    if command is None or command != "snapshot_counts":
      return super(SnapshotCounts, self).get(*args, **kwargs)
    kwargs.pop("command")
    return self.snapshot_counts_query(*args, **kwargs)
