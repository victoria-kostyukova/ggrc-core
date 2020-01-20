# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""App entities related to workflow."""
import attr

from lib.app_entity import _base


@attr.s
class Workflow(_base.Base, _base.WithTitleAndCode):
  """Represents Workflow entity."""
  state = attr.ib()
  admins = attr.ib()
  wf_members = attr.ib()
  is_archived = attr.ib()
  repeat_unit = attr.ib()
  repeat_every = attr.ib()
  task_groups = attr.ib()
  recurrences_started = attr.ib()


@attr.s
class TaskGroup(_base.Base, _base.WithTitleAndCode):
  """Represents TaskGroup entity."""
  assignee = attr.ib()
  workflow = attr.ib()
  task_group_tasks = attr.ib()


@attr.s
class TaskGroupTask(_base.Base, _base.WithTitleAndCode):
  """Represents TaskGroupTask entity."""
  assignees = attr.ib()
  start_date = attr.ib()
  due_date = attr.ib()
  task_group = attr.ib()


@attr.s
class WorkflowCycle(_base.Base):
  """Represents Cycle Workflow entity."""
  title = attr.ib()
  admins = attr.ib()
  wf_members = attr.ib()
  state = attr.ib()
  due_date = attr.ib()
  cycle_task_groups = attr.ib()
  workflow = attr.ib()


@attr.s
class CycleTaskGroup(_base.Base):
  """Represents Cycle TaskGroup entity."""
  title = attr.ib()
  state = attr.ib()
  cycle_tasks = attr.ib()
  workflow_cycle = attr.ib()
  task_group = attr.ib()


@attr.s
class CycleTask(_base.Base):
  """Represents Cycle TaskGroupTask entity."""
  title = attr.ib()
  state = attr.ib()
  assignees = attr.ib()
  due_date = attr.ib()
  comments = attr.ib()
  cycle_task_group = attr.ib()
  task_group_task = attr.ib()
