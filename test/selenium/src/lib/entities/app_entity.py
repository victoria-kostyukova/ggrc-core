# Copyright (C) 2018 Google Inc.
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
class _Base(object):
  """Represents entity."""
  obj_id = attr.ib()
  # `context` in REST. It is required to be properly set in some REST queries
  # (e.g. create task group)
  rest_context = attr.ib()

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
      if attr.has(obj):
        if id(obj) in seen_entity_obj_ids:
          return "{} with object id {} was here".format(
              obj.obj_type(), id(obj))
        seen_entity_obj_ids.add(id(obj))
        return collections.OrderedDict(
            (attr_name, process_obj(attr_value, seen_entity_obj_ids))
            for attr_name, attr_value
            in attr.asdict(obj, recurse=False).iteritems())
      if isinstance(obj, list):
        return [process_obj(list_elem, seen_entity_obj_ids)
                for list_elem in obj]
      return obj
    return process_obj(self, seen_entity_obj_ids=set())

  @classmethod
  def fields(cls):
    """Returns a list of object attributes."""
    return [attribute.name for attribute in attr.fields(cls)]


@attr.s
class _WithTitleAndCode(object):
  """Represents a part of object with title and code."""
  # pylint: disable=too-few-public-methods
  title = attr.ib()
  code = attr.ib()


@attr.s
class Workflow(_Base, _WithTitleAndCode):
  """Represents Workflow entity."""
  admins = attr.ib()
  wf_members = attr.ib()
  repeat_wf = attr.ib()
  task_groups = attr.ib()


@attr.s
class TaskGroup(_Base, _WithTitleAndCode):
  """Represents TaskGroup entity."""
  assignee = attr.ib()
  workflow = attr.ib()
  task_group_tasks = attr.ib()


@attr.s
class TaskGroupTask(_Base, _WithTitleAndCode):
  """Represents TaskGroupTask entity."""
  assignees = attr.ib()
  start_date = attr.ib()
  due_date = attr.ib()
  task_group = attr.ib()


@attr.s
class WorkflowCycle(_Base):
  """Represents Cycle Workflow entity."""
  title = attr.ib()
  admins = attr.ib()
  wf_members = attr.ib()
  state = attr.ib()
  due_date = attr.ib()
  cycle_task_groups = attr.ib()


@attr.s
class CycleTaskGroup(_Base):
  """Represents Cycle TaskGroup entity."""
  title = attr.ib()
  state = attr.ib()
  cycle_tasks = attr.ib()


@attr.s
class CycleTask(_Base):
  """Represents Cycle TaskGroupTask entity."""
  title = attr.ib()
  state = attr.ib()
  due_date = attr.ib()


@attr.s
class Person(_Base):
  """Represents Person entity."""
  name = attr.ib()
  email = attr.ib()


@attr.s
class Control(_Base, _WithTitleAndCode):
  """Represents Control entity."""
  admins = attr.ib()
  assertions = attr.ib()


@attr.s
class ControlAssertion(_Base):
  """Represents control assertion."""
  name = attr.ib()
