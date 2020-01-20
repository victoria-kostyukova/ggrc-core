# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Handler for imports and exports snapshoted instances."""
import sqlalchemy
from sqlalchemy.orm import load_only

from cached_property import cached_property

from ggrc import db
from ggrc import models
from ggrc.converters import errors
from ggrc.converters.handlers.handlers import MappingColumnHandler
from ggrc.models.mixins.with_custom_restrictions import WithCustomRestrictions
from ggrc.services import signals
from ggrc.snapshotter.rules import Types
from ggrc.utils import objects_cache


class SnapshotInstanceColumnHandler(MappingColumnHandler):
  """Handler for mapping and unmapping instances over snapshot.

  Is used for Audit-scope objects; maps objects to Snapshots in the
  corresponding Audit scope.
  """

  @cached_property
  def related_audit(self):
    audit_column_handler = self.row_converter.objects.get("audit")
    if audit_column_handler:
      audit_items = audit_column_handler.parse_item()
      return audit_items[0]
    return None

  def disable_snapshot_map_to_issue(self, to_append_ids):
    """Disable mapping of snapshot to Issue via import."""
    if to_append_ids:
      self.add_warning(errors.ISSUE_SNAPSHOT_MAP_WARNING,
                       column_name=self.mapping_object.__name__)

  def get_audit_object_pool_query(self, child_ids=None):
    if isinstance(self.row_converter.obj, models.Audit):
      audit_id = self.row_converter.obj.id
    elif hasattr(self.row_converter.obj, "audit_id"):
      audit_id = (getattr(self.row_converter.obj, "audit_id") or
                  getattr(self.row_converter.obj, "audit").id)
    elif self.row_converter.is_new and self.related_audit:
      audit_id = self.related_audit.id
    else:
      sub = models.Relationship.get_related_query(
          self.row_converter.obj,
          models.Audit(),
      ).subquery("audit")
      audit_id = sqlalchemy.case(
          [
              (
                  sub.c.destination_type == models.Audit.__name__,
                  sub.c.destination_id,
              ),
          ],
          else_=sub.c.source_id,
      )
    query = models.Snapshot.query.filter(
        models.Snapshot.parent_id == audit_id,
        models.Snapshot.parent_type == models.Audit.__name__,
        models.Snapshot.child_type == self.mapping_object.__name__,
    )
    if child_ids:
      query = query.filter(models.Snapshot.child_id.in_(child_ids))
    return query

  @property
  def snapshoted_instances_query(self):
    """Property, return query of mapping objects

    It should be related to row instance over snapshot relation"""
    if self.row_converter.obj.id is None:
      # For new object query should be empty
      return self.mapping_object.query.filter(
          self.mapping_object.id.is_(None))
    rel_snapshots = models.Relationship.get_related_query(
        self.row_converter.obj, models.Snapshot(),
    ).subquery("snapshot_rel")
    case_statement = sqlalchemy.case(
        [
            (
                rel_snapshots.c.destination_type == models.Snapshot.__name__,
                rel_snapshots.c.destination_id,
            ),
        ],
        else_=rel_snapshots.c.source_id,
    )
    snapshot = models.Snapshot.query.filter(
        models.Snapshot.id == case_statement,
        models.Snapshot.child_type == self.mapping_object.__name__,
    ).options(
        load_only(models.Snapshot.child_id)
    ).subquery('snapshots')
    return self.mapping_object.query.filter(
        self.mapping_object.id == snapshot.c.child_id
    )

  def insert_object(self):
    "insert object handler"
    if self.dry_run or not self.value:
      return
    row_obj = self.row_converter.obj
    relationships = []
    child_ids = [o.id for o in self.value]
    child_id_snapshot_dict = {
        i.child_id: i
        for i in self.get_audit_object_pool_query(
            child_ids
        ).options(
            sqlalchemy.orm.undefer_group('Snapshot_complete')
        )
    }
    mapping_query = models.Relationship.query.filter(
        models.Relationship.source_type == row_obj.type,
        models.Relationship.source_id == row_obj.id,
        models.Relationship.destination_type == models.Snapshot.__name__,
    ).union(
        models.Relationship.query.filter(
            models.Relationship.destination_type == row_obj.type,
            models.Relationship.destination_id == row_obj.id,
            models.Relationship.source_type == models.Snapshot.__name__,
        )
    ).options(
        sqlalchemy.orm.load_only(models.Relationship.id),
        sqlalchemy.orm.load_only(models.Relationship.source_id),
        sqlalchemy.orm.load_only(models.Relationship.source_type),
        sqlalchemy.orm.load_only(models.Relationship.destination_id),
        sqlalchemy.orm.load_only(models.Relationship.destination_type),
    )
    mappings = {(r.source_id
                 if r.source_type == models.Snapshot.__name__
                 else r.destination_id): r for r in mapping_query}
    for obj in self.value:
      snapshot = child_id_snapshot_dict.get(obj.id)
      mapping = mappings.get(snapshot.id)
      if not self.unmap and not mapping:
        mapping = models.Relationship(source=row_obj, destination=snapshot)
        relationships.append(mapping)
        db.session.add(mapping)
        signals.Restful.model_posted.send(models.Relationship, obj=mapping)
      elif self.unmap and mapping:
        db.session.delete(mapping)
        signals.Restful.model_deleted.send(models.Relationship, obj=mapping)
    db.session.flush(relationships)
    self.dry_run = True

  def get_value(self):
    """return column value"""
    if self.unmap or not self.mapping_object:
      return ""

    obj_class = self.row_converter.block_converter.object_class
    obj_ids = self.row_converter.block_converter.object_ids
    if obj_class == models.Audit and self.mapping_object.__name__ in Types.all:
      mapped_snapshots = objects_cache.audit_snapshot_slugs_cache(obj_ids)
    else:
      mapped_snapshots = objects_cache.related_snapshot_slugs_cache(
          obj_class,
          obj_ids
      )

    snapshot_slugs = mapped_snapshots[self.row_converter.obj.id].get(
        self.mapping_object.__name__,
        set(),
    )
    human_readable_ids = sorted(snapshot_slugs)
    return "\n".join(human_readable_ids)

  def is_valid_creation(self, to_append_ids):
    "return True if data valid else False"
    if not to_append_ids:
      return True
    pool_ids = {
        i.child_id for i in self.get_audit_object_pool_query(
            to_append_ids
        ).options(
            sqlalchemy.orm.load_only(models.Snapshot.child_id)
        )}
    if to_append_ids - pool_ids:
      self.add_error(errors.ILLEGAL_APPEND_CONTROL_VALUE,
                     object_type=self.row_converter.obj.__class__.__name__,
                     mapped_type=self.mapping_object.__name__)
      return False
    return True

  def parse_item(self, *args, **kwargs):
    """Parse items and make validation"""
    items = super(SnapshotInstanceColumnHandler, self).parse_item(
        *args, **kwargs
    )
    exists_ids = {
        row.id for row in
        self.snapshoted_instances_query.values(self.mapping_object.id)
    }
    import_ids = {i.id for i in items or []}
    to_append_ids = import_ids - exists_ids
    if isinstance(self.row_converter.obj, models.Issue):
      self.disable_snapshot_map_to_issue(to_append_ids)
      return None
    if isinstance(self.row_converter.obj, WithCustomRestrictions):
      if "map: Snapshots" in self.row_converter.obj.mapping_restrictions():
        if to_append_ids:
          self.add_warning(errors.SOX_SNAPSHOT_MAP_WARNING,
                           column_name=self.mapping_object.__name__,
                           object=self.row_converter.obj.__class__.__name__)
          return None
    self.is_valid_creation(to_append_ids)
    return items
