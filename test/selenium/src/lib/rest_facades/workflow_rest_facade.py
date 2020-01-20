# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""REST facade for Workflow objects (functions also create entity objects)."""
from lib import decorator
from lib.app_entity_factory import workflow_entity_factory
from lib.rest_services import workflow_rest_service


@decorator.check_that_obj_is_created
def create_workflow(**attrs):
  """Creates Workflow via REST."""
  workflow = workflow_entity_factory.WorkflowFactory().create(**attrs)
  return workflow_rest_service.WorkflowRestService().create(workflow)


@decorator.check_that_obj_is_created
def create_task_group(**attrs):
  """Creates TaskGroup via REST."""
  task_group = workflow_entity_factory.TaskGroupFactory().create(**attrs)
  return workflow_rest_service.TaskGroupRestService().create(task_group)


@decorator.check_that_obj_is_created
def create_task_group_task(**attrs):
  """Creates TaskGroupTask via REST."""
  task_group_task = workflow_entity_factory.TaskGroupTaskFactory().create(
      **attrs)
  return workflow_rest_service.TaskGroupTaskRestService().create(
      task_group_task)
