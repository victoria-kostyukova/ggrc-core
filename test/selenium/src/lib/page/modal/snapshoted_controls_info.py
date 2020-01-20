# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Snapshoted control info modal."""
import re
from lib import base, factory
from lib.constants import objects


class SnapshotedControlsInfo(base.Modal):
  """Snapshoted control info modal."""
  # pylint: disable=too-few-public-methods

  def __init__(self):
    super(SnapshotedControlsInfo, self).__init__()
    self._root = self._browser.div(class_name="mapped-controls-info")

  def get_related_snapshots(self, entity_type):
    """Returns list of dicts for specific type snapshots related to the
    snapshoted control."""
    return RelatedSnapshotsSection(self._root, entity_type).snapshots


class RelatedSnapshotsSection(object):
  """Collapsible panel for related snapshots of specific types (regulations,
  requirements) from snapshoted control info modal."""

  def __init__(self, parent_element, object_type):
    self.type = object_type
    self._root = parent_element.element(
        tag_name="collapsible-panel",
        text=re.compile(r"show related {}s".format(self.type).upper()))

  @property
  def is_expanded(self):
    return "is-expanded" in self._root.div(
        class_name="body-inner").classes

  def expand(self):
    """Expand section if it is not expanded already."""
    if not self.is_expanded:
      self._root.span().click()

  @property
  def snapshots(self):
    """List of snapshots related to the snapshoted control."""
    obj_list = []
    self.expand()
    for item in self._root.divs(class_name="mapped-object-info"):
      obj = {}
      for field in item.divs(class_name="mapped-object-info__item"):
        key, value = field.text.splitlines()[:2]
        obj[key.lower()] = value if value != 'None' else None
      obj_list.append(factory.get_cls_entity_factory(
          objects.get_plural(self.type))().create(**obj))
    return obj_list
