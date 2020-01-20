# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Register various listeners needed for snapshot operation"""

from ggrc import db
from ggrc import models
from ggrc.login import get_current_user_id
from ggrc.services import signals
from ggrc.snapshotter import create_snapshots
from ggrc.snapshotter import upsert_snapshots
from ggrc.snapshotter.datastructures import Stub
from ggrc.snapshotter.rules import get_rules


def create_all(sender, obj=None, src=None, service=None, event=None):  # noqa
  """Creates snapshots."""
  del sender, service  # Unused
  # We use "operation" for non-standard operations (e.g. cloning)
  if not src.get("operation"):
    create_snapshots(obj, event)


def upsert_all(
    sender, obj=None, src=None, service=None,
    event=None, initial_state=None):  # noqa
  """Updates snapshots globally."""
  del sender, service, initial_state  # Unused
  snapshot_settings = src.get("snapshots")
  if snapshot_settings:
    if snapshot_settings["operation"] == "upsert":
      revisions = {
          (Stub.from_dict(revision["parent"]),
           Stub.from_dict(revision["child"])): revision["revision_id"]
          for revision in snapshot_settings.get("revisions", {})}
      upsert_snapshots(obj, event, revisions=revisions)


def _copy_snapshot_relationships(*_, **kwargs):
  """Add relationships between snapshotted objects.

  Create relationships between new snapshot and other snapshots
  if a relationship exists between a pair of object that was snapshotted.
  """
  query = """
      INSERT IGNORE INTO relationships (
          modified_by_id, created_at, updated_at, source_id, source_type,
          destination_id, destination_type, context_id
      )
      SELECT
          :user_id, now(), now(), s_1.id, "Snapshot",
          s_2.id, "Snapshot", s_2.context_id
      FROM relationships AS rel
      INNER JOIN snapshots AS s_1
          ON (s_1.child_type, s_1.child_id) =
             (rel.source_type, rel.source_id)
      INNER JOIN snapshots AS s_2
          ON (s_2.child_type, s_2.child_id) =
             (rel.destination_type, rel.destination_id)
      WHERE
          s_1.parent_id = :parent_id AND
          s_2.parent_id = :parent_id AND
          (s_1.id = :snapshot_id OR s_2.id = :snapshot_id)
      """
  db.session.execute(query, {
      "user_id": get_current_user_id(),
      "parent_id": kwargs.get("obj").parent.id,
      "snapshot_id": kwargs.get("obj").id
  })


def register_snapshot_listeners():
  """Attaches listeners to various models."""

  rules = get_rules()

  # Initialize listening on parent objects
  for model_cls in rules.rules.iterkeys():
    model = getattr(models.all_models, model_cls)
    signals.Restful.model_posted_after_commit.connect(
        create_all, model, weak=False)
    signals.Restful.model_put_after_commit.connect(
        upsert_all, model, weak=False)

  signals.Restful.model_posted_after_commit.connect(
      _copy_snapshot_relationships, models.Snapshot)
