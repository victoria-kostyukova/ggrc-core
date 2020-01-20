# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Factories for app entities in workflow.py."""
import datetime

from lib import users
from lib.app_entity import workflow_entity
from lib.app_entity_factory import _base
from lib.constants import object_states
from lib.utils import date_utils


class WorkflowFactory(_base.BaseFactory):
  """Factory for Workflow entities."""
  _entity_cls = workflow_entity.Workflow

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


class TaskGroupFactory(_base.BaseFactory):
  """Factory for TaskGroup entities."""
  _entity_cls = workflow_entity.TaskGroup

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


class TaskGroupTaskFactory(_base.BaseFactory):
  """Factory for TaskGroupTask entities."""
  _entity_cls = workflow_entity.TaskGroupTask

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


class WorkflowCycleFactory(_base.BaseFactory):
  """Factory for WorflowCycle entities."""
  _entity_cls = workflow_entity.WorkflowCycle

  def _post_obj_init(self, obj):
    """Set WorkflowCycle for each associated CycleTaskGroup."""
    for cycle_task_group in obj.cycle_task_groups:
      cycle_task_group.workflow_cycle = obj


class CycleTaskGroupFactory(_base.BaseFactory):
  """Factory for CycleTaskGroup entities."""
  _entity_cls = workflow_entity.CycleTaskGroup

  def _post_obj_init(self, obj):
    """Add CycleTaskGroup to associated WorkflowCycle.
    Set CycleTaskGroup for each associated CycleTask.
    """
    if obj.workflow_cycle:
      obj.workflow_cycle.cycle_task_groups.append(obj)
    for cycle_task in obj.cycle_tasks:
      cycle_task.cycle_task_group = obj


class CycleTaskFactory(_base.BaseFactory):
  """Factory for CycleTask entities."""
  _entity_cls = workflow_entity.CycleTask

  @property
  def _empty_attrs(self):
    """See superclass."""
    return {
        "comments": []
    }

  def _post_obj_init(self, obj):
    """Add CycleTask to associated CycleTaskGroup."""
    if obj.cycle_task_group:
      obj.cycle_task_group.cycle_tasks.append(obj)
