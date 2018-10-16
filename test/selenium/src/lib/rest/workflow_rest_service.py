# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""REST service for Workflow objects."""
from lib.rest import rest_convert, base_rest_service


def create_workflow(workflow):
  """Creates workflow via REST."""
  return base_rest_service.create_obj(
      workflow,
      access_control_list=rest_convert.build_access_control_list(workflow),
      title=workflow.title,
      context=rest_convert.default_context())


def create_task_group(task_group):
  """Creates task group via REST."""
  return base_rest_service.create_obj(
      task_group,
      contact=rest_convert.to_basic_rest_obj(task_group.assignee),
      title=task_group.title,
      workflow=rest_convert.to_basic_rest_obj(task_group.workflow),
      context=task_group.workflow.rest_context
  )


def create_task_group_task(task_group_task):
  """Creates task group task via REST."""
  return base_rest_service.create_obj(
      task_group_task,
      access_control_list=rest_convert.build_access_control_list(
          task_group_task),
      title=task_group_task.title,
      start_date=task_group_task.start_date.isoformat(),
      end_date=task_group_task.due_date.isoformat(),
      task_group=rest_convert.to_basic_rest_obj(task_group_task.task_group),
      context=task_group_task.task_group.rest_context
  )
