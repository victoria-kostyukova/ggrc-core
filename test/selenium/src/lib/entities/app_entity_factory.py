# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Factories for app_entity."""
import datetime

from lib import users
from lib.constants import object_states
from lib.entities import app_entity
from lib.utils import random_utils, date_utils, string_utils


def get_factory_by_obj_name(obj_name):
  """Returns a factory class by object name."""
  return {
      "control": ControlFactory
  }[obj_name]


def get_factory_by_entity_cls(entity_cls):
  """Returns a factory class by entity class."""
  # pylint: disable=protected-access
  return next(factory_cls for factory_cls in _BaseFactory.__subclasses__()
              if factory_cls._entity_cls == entity_cls)


class _BaseFactory(object):
  """Base factory for app entities."""

  @property
  def _entity_cls(self):
    """Returns an app entity to create. To be overridden in subclass."""
    raise NotImplementedError

  @property
  def _empty_attrs(self):
    """Returns a dict of attributes used to create an empty entity object so
    all attributes will have values of valid types (e.g. empty lists or dicts).
    May be overridden in subclass.
    """
    return {}

  @property
  def _default_attrs(self):
    """Returns a dict of random mandatory attributes used to create a default
    object.
    May be overridden in subclass.
    """
    return {}

  def _post_obj_init(self, obj):
    """Run operations after creating an object (e.g. when creating a workflow
    set workflow for task group).
    May be overridden in subclass.
    """
    pass

  def create(self, **attrs):
    """Creates a random app entity with `args`."""
    attrs.update(self._default_attrs)
    return self.create_empty(**attrs)

  def create_empty(self, **attrs):
    """Creates an app entity from `args`. Attributes that are not passed,
    will be set to None.
    """
    all_attr_names = self._entity_cls.fields()
    all_attrs = dict.fromkeys(all_attr_names)
    attrs_to_set = self._empty_attrs
    attrs_to_set.update(attrs)
    for attr_name, attr_value in attrs_to_set.iteritems():
      all_attrs[attr_name] = attr_value
    obj = self._entity_cls(**all_attrs)
    self._post_obj_init(obj)
    return obj

  @property
  def _obj_title(self):
    """Returns a random object title for the object."""
    return random_utils.get_title(self._obj_name())

  @classmethod
  def _obj_name(cls):
    """Returns object name for app entity."""
    return string_utils.remove_from_end(cls.__name__, "Factory")


class WorkflowFactory(_BaseFactory):
  """Factory for Workflow entities."""
  _entity_cls = app_entity.Workflow

  @property
  def _empty_attrs(self):
    """See superclass."""
    return {
        "admins": [],
        "wf_members": [],
        "task_groups": []
    }

  @property
  def _default_attrs(self):
    """See superclass."""
    return {
        "state": object_states.DRAFT,
        "title": self._obj_title,
        "admins": [users.current_person()],
        "is_archived": False,
        "recurrences_started": False
    }

  def _post_obj_init(self, obj):
    """Set workflow for each task group associated with this workflow."""
    for task_group in obj.task_groups:
      task_group.workflow = obj


class TaskGroupFactory(_BaseFactory):
  """Factory for TaskGroup entities."""
  _entity_cls = app_entity.TaskGroup

  @property
  def _empty_attrs(self):
    """See superclass."""
    return {
        "task_group_tasks": []
    }

  @property
  def _default_attrs(self):
    """See superclass."""
    return {
        "title": self._obj_title,
        "assignee": users.current_person()
    }

  def _post_obj_init(self, obj):
    """Add this task group for a workflow associated with this task group.
    Set task group for each task group task associated with this task group.
    """
    if obj.workflow:
      obj.workflow.task_groups.append(obj)
    for task in obj.task_group_tasks:
      task.task_group = obj


class TaskGroupTaskFactory(_BaseFactory):
  """Factory for TaskGroupTask entities."""
  _entity_cls = app_entity.TaskGroupTask

  @property
  def _empty_attrs(self):
    """See superclass."""
    return {
        "assignees": []
    }

  @property
  def _default_attrs(self):
    """See superclass."""
    start_date = date_utils.first_not_weekend_day(datetime.date.today())
    return {
        "title": self._obj_title,
        "assignees": [users.current_person()],
        "start_date": start_date,
        "due_date": start_date + datetime.timedelta(days=14)
    }

  def _post_obj_init(self, obj):
    """Add task group task for a task group associated with this task group
    task.
    """
    if obj.task_group:
      obj.task_group.task_group_tasks.append(obj)


class WorkflowCycleFactory(_BaseFactory):
  """Factory for WorflowCycle entities."""
  _entity_cls = app_entity.WorkflowCycle

  def _post_obj_init(self, obj):
    """Set WorkflowCycle for each associated CycleTaskGroup."""
    for cycle_task_group in obj.cycle_task_groups:
      cycle_task_group.workflow_cycle = obj


class CycleTaskGroupFactory(_BaseFactory):
  """Factory for CycleTaskGroup entities."""
  _entity_cls = app_entity.CycleTaskGroup

  def _post_obj_init(self, obj):
    """Add CycleTaskGroup to associated WorkflowCycle.
    Set CycleTaskGroup for each associated CycleTask.
    """
    if obj.workflow_cycle:
      obj.workflow_cycle.cycle_task_groups.append(obj)
    for cycle_task in obj.cycle_tasks:
      cycle_task.cycle_task_group = obj


class CycleTaskFactory(_BaseFactory):
  """Factory for CycleTask entities."""
  _entity_cls = app_entity.CycleTask

  def _post_obj_init(self, obj):
    """Add CycleTask to associated CycleTaskGroup."""
    if obj.cycle_task_group:
      obj.cycle_task_group.cycle_tasks.append(obj)


class PersonFactory(_BaseFactory):
  """Factory for Person entities."""
  _entity_cls = app_entity.Person

  @property
  def _default_attrs(self):
    """See superclass."""
    return {
        "name": self._obj_title,
        "email": random_utils.get_email()
    }


class ControlFactory(_BaseFactory):
  """Factory for Control entities."""
  _entity_cls = app_entity.Control

  @property
  def _empty_attrs(self):
    """See superclass."""
    return {
        "admins": [],
        "assertions": []
    }

  @property
  def _default_attrs(self):
    """See superclass."""
    from lib.rest_services import control_rest_service
    return {
        "title": self._obj_title,
        "admins": [users.current_person()],
        "assertions": [control_rest_service.assertion_with_name("Security")]
    }


class ControlAssertionFactory(_BaseFactory):
  """Factory for Control Assertions."""
  _entity_cls = app_entity.ControlAssertion
