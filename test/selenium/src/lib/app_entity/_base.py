# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""App entities.
Design notes:
* Attributes may not be fully set. Value set to None means that
an attribute value is unknown.
It should not be compared when comparing objects.
* If an attribute appears only at one layer (REST, UI or Import), it should
still be here.
* Attributes may be other objects.
"""
import collections

import attr
import inflection

from lib.constants import objects


@attr.s
class Base(object):
  """Represents entity."""
  obj_id = attr.ib()
  created_at = attr.ib()
  updated_at = attr.ib()
  modified_by = attr.ib()
  # `context` in REST. It is required to be properly set in some REST queries
  # (e.g. create task group)
  rest_context = attr.ib()
  # HTTP headers required for PUT / DELETE requests
  rest_headers_for_update = attr.ib()

  @classmethod
  def obj_name(cls):
    """Returns object name (e.g. TaskGroup -> task_group)."""
    return inflection.underscore(cls.__name__)

  @classmethod
  def plural_obj_name(cls):
    """Returns plural object name (e.g. TaskGroup -> task_groups)."""
    return objects.get_plural(cls.obj_name())

  @classmethod
  def obj_type(cls):
    """Returns object type."""
    return cls.__name__

  def obj_dict(self):
    """Returns a dict of attributes.
    Circular references related to entities are replaced with strings
    containing info on object type and Python object id.
    """
    def process_obj(obj, seen_entity_obj_ids):
      """Convert an obj to dict replacing circular references."""
      # `seen_entity_obj_ids` is a list of entity object ids from the root
      #   `obj` to the current obj
      if attr.has(obj):
        if id(obj) in seen_entity_obj_ids:
          return "{} was here".format(obj.obj_type())
        obj_dict = collections.OrderedDict()
        for name, value in attr.asdict(obj, recurse=False).iteritems():
          obj_dict[name] = process_obj(
              value, seen_entity_obj_ids=seen_entity_obj_ids + [id(obj)])
        return obj_dict
      if isinstance(obj, list):
        return [process_obj(list_elem, seen_entity_obj_ids)
                for list_elem in obj]
      return obj
    return process_obj(self, seen_entity_obj_ids=[])

  @classmethod
  def fields(cls):
    """Returns a list of object attributes."""
    return [attribute.name for attribute in attr.fields(cls)]


@attr.s
class WithTitleAndCode(object):
  """Represents a part of object with title and code."""
  # pylint: disable=too-few-public-methods
  title = attr.ib()
  code = attr.ib()
