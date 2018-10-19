# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Factories for app_entity."""
import datetime

from lib import users
from lib.constants import object_states
from lib.entities import app_entity
from lib.utils import random_utils, date_utils


def get_factory_by_obj_name(obj_name):
  """Returns a factory class by object name."""
  return {
      "control": ControlFactory
  }[obj_name]


class _BaseFactory(object):
  """Base factory for app entities."""

  @property
  def _entity_cls(self):
    """Returns an app entity to create. To be overridden in subclass."""
    raise NotImplementedError

  @property
  def _empty_attrs(self):
    """Returns a dict of attributes used to create an empty entity object (e.g.
    empty lists or dicts).
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
    return cls.__name__.rstrip("Factory")


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
        "title": self._obj_title,
        "admins": [users.current_person()]
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
    closest_working_day = date_utils.closest_working_day()
    return {
        "title": self._obj_title,
        "assignees": [users.current_person()],
        "start_date": closest_working_day,
        "due_date": closest_working_day + datetime.timedelta(days=14)
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

  def create_from_workflow(self, workflow):
    """Creates expected WorkflowCycle entity from Workflow entity."""
    cycle_task_groups = [
        CycleTaskGroupFactory().create_from_task_group(task_group)
        for task_group in workflow.task_groups]
    cycle_tasks = [cycle_task for cycle_task_group in cycle_task_groups
                   for cycle_task in cycle_task_group.cycle_tasks]
    return self.create_empty(
        title=workflow.title,
        admins=workflow.admins,
        wf_members=workflow.wf_members,
        state=object_states.ASSIGNED,
        due_date=max(cycle_task.due_date for cycle_task in cycle_tasks),
        cycle_task_groups=cycle_task_groups
    )


class CycleTaskGroupFactory(_BaseFactory):
  """Factory for CycleTaskGroup entities."""
  _entity_cls = app_entity.CycleTaskGroup

  def create_from_task_group(self, task_group):
    """Creates expected CycleTaskGroup entity from TaskGroup entity."""
    cycle_tasks = [CycleTaskFactory().create_from_task(task)
                   for task in task_group.task_group_tasks]
    return self.create_empty(
        title=task_group.title,
        state=object_states.ASSIGNED,
        cycle_tasks=cycle_tasks
    )


class CycleTaskFactory(_BaseFactory):
  """Factory for CycleTask entities."""
  _entity_cls = app_entity.CycleTask

  def create_from_task(self, task_group_task):
    """Creates expected CycleTask entity from TaskGroupTask entity."""
    return self.create_empty(
        title=task_group_task.title,
        state=object_states.ASSIGNED,
        due_date=task_group_task.due_date
    )


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
    from lib.rest import control_assertions
    return {
        "title": self._obj_title,
        "admins": [users.current_person()],
        "assertions": [control_assertions.assertion_with_name("Security")]
    }


class ControlAssertionFactory(_BaseFactory):
  """Factory for Control Assertions."""
  _entity_cls = app_entity.ControlAssertion
